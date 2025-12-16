/**
 * @fileoverview Create Envelope Wizard - Multi-step wizard for creating signature envelopes
 * @summary Complete wizard component for envelope creation with improved UX
 * @description
 * This component provides a step-by-step wizard for creating signature envelopes.
 * Flow: Upload PDF → Add Signers → Configure → Review → Create
 * Each step is validated before allowing progression to the next step.
 */

import { type ReactElement, useState } from 'react';
import { WizardStep } from '@lawprotect/frontend-core';
import { useCreateEnvelopeWizard } from '../hooks/useCreateEnvelopeWizard';
import { useSignatureHttpClient, useCreateEnvelope } from '@lawprotect/frontend-core';
import { LocalStorageAdapter } from '../../../app/adapters/LocalStorageAdapter';
import { Button } from '../../../ui-kit/buttons/Button';
import { PageLayout } from '../../../ui-kit/layout/PageLayout';
import { Alert } from '../../../ui-kit/feedback/Alert';
import { WizardStepUpload } from './WizardStepUpload';
import { WizardStepSigners } from './WizardStepSigners';
import { WizardStepConfigure } from './WizardStepConfigure';
import { WizardStepReview } from './WizardStepReview';

/**
 * @description Multi-step wizard for creating signature envelopes.
 * @returns JSX element with the complete wizard flow
 */
export function CreateEnvelopeWizard(): ReactElement {
  const storage = new LocalStorageAdapter();
  const httpClient = useSignatureHttpClient({
    fetchImpl: fetch,
    storage,
    tokenKey: 'auth_token',
  });

  const {
    currentStep,
    formData,
    isLoading,
    error,
    setPdfFile,
    setS3Keys,
    addSigner,
    removeSigner,
    updateSigner,
    updateConfig,
    setOriginType,
    nextStep,
    previousStep,
    goToStep,
    reset,
    setLoading,
    setError,
  } = useCreateEnvelopeWizard();

  const { mutateAsync: createEnvelope, isPending: isCreating } = useCreateEnvelope({ httpClient });
  const [createdEnvelopeId, setCreatedEnvelopeId] = useState<string | null>(null);

  /**
   * @description Handles PDF file upload and S3 upload.
   */
  const handlePdfUpload = async (file: File, source: ArrayBuffer) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Upload to S3 via documents service
      // For now, we'll use placeholder keys
      // In production, this should call the documents service to upload
      const sourceKey = `documents/${Date.now()}/${file.name}`;
      const metaKey = `meta/${Date.now()}/${file.name}.meta.json`;

      setPdfFile(file, source);
      setS3Keys(sourceKey, metaKey);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload PDF');
      setLoading(false);
    }
  };

  /**
   * @description Handles envelope creation.
   */
  const handleCreate = async () => {
    if (!formData.sourceKey || !formData.metaKey) {
      setError('Please upload a document first.');
      return;
    }

    if (formData.signers.length === 0) {
      setError('Please add at least one signer.');
      return;
    }

    if (!formData.config.title) {
      setError('Please provide a title for the envelope.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await createEnvelope({
        title: formData.config.title,
        description: formData.config.description,
        signingOrderType: formData.config.signingOrderType,
        originType: formData.originType,
        templateId: formData.templateId,
        templateVersion: formData.templateVersion,
        expiresAt: formData.config.expiresAt,
        sourceKey: formData.sourceKey,
        metaKey: formData.metaKey,
      });
      setCreatedEnvelopeId((data as any).id);
      setLoading(false);
      // TODO: Navigate to envelope details or show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create envelope');
      setLoading(false);
    }
  };

  /**
   * @description Renders the current step content.
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.UPLOAD:
        return (
          <WizardStepUpload
            pdfFile={formData.pdfFile}
            onUpload={handlePdfUpload}
            isLoading={isLoading}
            onOriginTypeChange={setOriginType}
          />
        );
      case WizardStep.SIGNERS:
        return (
          <WizardStepSigners
            signers={formData.signers}
            onAddSigner={addSigner}
            onRemoveSigner={removeSigner}
            onUpdateSigner={updateSigner}
          />
        );
      case WizardStep.CONFIGURE:
        return (
          <WizardStepConfigure
            config={formData.config}
            onUpdateConfig={updateConfig}
            signingOrderType={formData.config.signingOrderType}
          />
        );
      case WizardStep.REVIEW:
        return (
          <WizardStepReview
            formData={formData}
            onEditStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  /**
   * @description Gets the step title.
   */
  const getStepTitle = () => {
    switch (currentStep) {
      case WizardStep.UPLOAD:
        return 'Upload Document';
      case WizardStep.SIGNERS:
        return 'Add Signers';
      case WizardStep.CONFIGURE:
        return 'Configure Envelope';
      case WizardStep.REVIEW:
        return 'Review & Create';
      default:
        return 'Create Envelope';
    }
  };

  /**
   * @description Gets the step description.
   */
  const getStepDescription = () => {
    switch (currentStep) {
      case WizardStep.UPLOAD:
        return 'Upload a PDF document or select a template to get started';
      case WizardStep.SIGNERS:
        return 'Add the people who need to sign this document';
      case WizardStep.CONFIGURE:
        return 'Set the title, description, and signing preferences';
      case WizardStep.REVIEW:
        return 'Review all details before creating the envelope';
      default:
        return '';
    }
  };

  const steps: Array<{ key: WizardStep; label: string }> = [
    { key: WizardStep.UPLOAD, label: 'Upload' },
    { key: WizardStep.SIGNERS, label: 'Signers' },
    { key: WizardStep.CONFIGURE, label: 'Configure' },
    { key: WizardStep.REVIEW, label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  if (createdEnvelopeId) {
    return (
      <PageLayout
        title={
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Envelope Created!</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your envelope has been created successfully.</p>
          </div>
        }
      >
        <div className="mx-auto max-w-2xl space-y-4">
          <Alert tone="success" message="Envelope created successfully!" />
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Envelope ID: <span className="font-mono font-medium">{createdEnvelopeId}</span>
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  // TODO: Navigate to envelope details
                  window.location.href = `/signature/envelopes/${createdEnvelopeId}`;
                }}
                className="bg-sky-600 text-white hover:bg-sky-500"
              >
                View Envelope
              </Button>
              <Button
                onClick={() => {
                  reset();
                  setCreatedEnvelopeId(null);
                }}
                className="bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Create New Envelope</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{getStepDescription()}</p>
        </div>
      }
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    index <= currentStepIndex
                      ? 'border-sky-600 bg-sky-600 text-white'
                      : 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    index <= currentStepIndex ? 'text-sky-600' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    index < currentStepIndex ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && <Alert tone="error" message={error} />}

        {/* Step Content */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            onClick={previousStep}
            disabled={currentStep === WizardStep.UPLOAD || isLoading || isCreating}
            className="bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            Previous
          </Button>
          <div className="flex gap-2">
            {currentStep === WizardStep.REVIEW ? (
              <Button
                onClick={handleCreate}
                disabled={isLoading || isCreating}
                className="bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Envelope'}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={isLoading}
                className="bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

