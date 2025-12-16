/**
 * @fileoverview Wizard Step Review - Final step of envelope creation wizard
 * @summary Component for reviewing envelope details before creation
 * @description
 * This component handles the final step of the envelope creation wizard,
 * displaying a summary of all configured options for review.
 */

import { type ReactElement } from 'react';
import { WizardStep, DocumentOriginType, SigningOrderType } from '@lawprotect/frontend-core';
import type { WizardStepReviewProps } from '../interfaces/WizardComponentsInterfaces';

/**
 * @description Gets human-readable label for origin type.
 * @param originType Document origin type enum value
 * @returns Human-readable label string
 */
const getOriginTypeLabel = (originType: DocumentOriginType): string => {
  switch (originType) {
    case DocumentOriginType.UPLOAD:
      return 'Uploaded Document';
    case DocumentOriginType.TEMPLATE:
      return 'Template';
    case DocumentOriginType.GENERATED:
      return 'Generated Document';
    default:
      return originType;
  }
};

/**
 * @description Gets human-readable label for signing order type.
 * @param signingOrderType Signing order type enum value
 * @returns Human-readable label string
 */
const getSigningOrderLabel = (signingOrderType: SigningOrderType): string => {
  switch (signingOrderType) {
    case SigningOrderType.OWNER_FIRST:
      return 'Owner Signs First';
    case SigningOrderType.INVITEES_FIRST:
      return 'Invitees Sign First';
    default:
      return signingOrderType;
  }
};

/**
 * @description Gets human-readable label for signer type.
 * @param isExternal Whether the signer is external
 * @returns Human-readable label string
 */
const getSignerTypeLabel = (isExternal: boolean): string => {
  return isExternal ? 'External' : 'Internal';
};

/**
 * @description Review step component for the envelope creation wizard.
 * @param props Component props
 * @returns JSX element with review summary
 */
export function WizardStepReview({ formData, onEditStep }: WizardStepReviewProps): ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Review & Create</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Please review all details before creating the envelope
        </p>
      </div>

      <div className="space-y-4">
        {/* Document Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-50">Document</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formData.pdfFile?.name || 'Template/Generated'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Source: {getOriginTypeLabel(formData.originType)}
              </p>
            </div>
            <button
              onClick={() => onEditStep(WizardStep.UPLOAD)}
              className="text-sm text-sky-600 hover:text-sky-700"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Signers Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-slate-900 dark:text-slate-50">
              Signers ({formData.signers.length})
            </h3>
            <button
              onClick={() => onEditStep(WizardStep.SIGNERS)}
              className="text-sm text-sky-600 hover:text-sky-700"
            >
              Edit
            </button>
          </div>
          <div className="space-y-2">
            {formData.signers.map((signer, index) => (
              <div key={index} className="text-sm text-slate-600 dark:text-slate-400">
                {signer.fullName} ({signer.email}) - {getSignerTypeLabel(signer.isExternal)}
                {signer.order && ` - Order: ${signer.order}`}
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Section */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-slate-900 dark:text-slate-50">Configuration</h3>
            <button
              onClick={() => onEditStep(WizardStep.CONFIGURE)}
              className="text-sm text-sky-600 hover:text-sky-700"
            >
              Edit
            </button>
          </div>
          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <p><span className="font-medium">Title:</span> {formData.config.title}</p>
            {formData.config.description && (
              <p><span className="font-medium">Description:</span> {formData.config.description}</p>
            )}
            <p><span className="font-medium">Signing Order:</span> {getSigningOrderLabel(formData.config.signingOrderType)}</p>
            {formData.config.expiresAt && (
              <p>
                <span className="font-medium">Expires:</span>{' '}
                {new Date(formData.config.expiresAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

