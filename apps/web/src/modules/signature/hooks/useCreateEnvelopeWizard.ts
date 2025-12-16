/**
 * @fileoverview useCreateEnvelopeWizard Hook - State management for envelope creation wizard
 * @summary Custom hook for managing multi-step envelope creation flow
 * @description
 * Provides state management and navigation for the envelope creation wizard.
 * Handles form data collection, step navigation, and validation across steps.
 */

import { useState, useCallback } from 'react';
import { DocumentOriginType, SigningOrderType, WizardStep } from '@lawprotect/frontend-core';
import type { WizardFormData, WizardSigner, WizardConfig } from '../types/CreateEnvelopeWizard';

/**
 * @description Initial form data for the wizard.
 */
const initialFormData: WizardFormData = {
  pdfFile: null,
  pdfSource: null,
  sourceKey: null,
  metaKey: null,
  signers: [],
  config: {
    title: '',
    description: '',
    signingOrderType: SigningOrderType.OWNER_FIRST,
    expiresAt: undefined,
  },
  originType: DocumentOriginType.UPLOAD,
};

/**
 * @description Hook for managing envelope creation wizard state.
 * @returns Wizard state and navigation functions
 *
 * @example
 * ```tsx
 * const {
 *   currentStep,
 *   formData,
 *   isLoading,
 *   error,
 *   setPdfFile,
 *   addSigner,
 *   removeSigner,
 *   updateConfig,
 *   nextStep,
 *   previousStep,
 *   goToStep,
 *   reset
 * } = useCreateEnvelopeWizard();
 * ```
 */
export function useCreateEnvelopeWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.UPLOAD);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * @description Sets the uploaded PDF file.
   */
  const setPdfFile = useCallback((file: File | null, source: ArrayBuffer | null) => {
    setFormData((prev) => ({
      ...prev,
      pdfFile: file,
      pdfSource: source,
    }));
    setError(null);
  }, []);

  /**
   * @description Sets the S3 keys after upload.
   */
  const setS3Keys = useCallback((sourceKey: string, metaKey: string) => {
    setFormData((prev) => ({
      ...prev,
      sourceKey,
      metaKey,
    }));
  }, []);

  /**
   * @description Adds a signer to the list.
   */
  const addSigner = useCallback((signer: WizardSigner) => {
    setFormData((prev) => ({
      ...prev,
      signers: [...prev.signers, signer],
    }));
    setError(null);
  }, []);

  /**
   * @description Removes a signer by index.
   */
  const removeSigner = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      signers: prev.signers.filter((_, i) => i !== index),
    }));
  }, []);

  /**
   * @description Updates a signer by index.
   */
  const updateSigner = useCallback((index: number, signer: Partial<WizardSigner>) => {
    setFormData((prev) => ({
      ...prev,
      signers: prev.signers.map((s, i) => (i === index ? { ...s, ...signer } : s)),
    }));
  }, []);

  /**
   * @description Updates the envelope configuration.
   */
  const updateConfig = useCallback((config: Partial<WizardConfig>) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        ...config,
      },
    }));
    setError(null);
  }, []);

  /**
   * @description Sets the origin type and template info.
   */
  const setOriginType = useCallback((originType: DocumentOriginType, templateId?: string, templateVersion?: string) => {
    setFormData((prev) => ({
      ...prev,
      originType,
      templateId,
      templateVersion,
    }));
  }, []);

  /**
   * @description Validates the current step.
   */
  const validateStep = useCallback((step: WizardStep): boolean => {
    switch (step) {
      case WizardStep.UPLOAD:
        return !!formData.pdfFile && !!formData.sourceKey && !!formData.metaKey;
      case WizardStep.SIGNERS:
        return formData.signers.length > 0;
      case WizardStep.CONFIGURE:
        return !!formData.config.title;
      case WizardStep.REVIEW:
        return true;
      default:
        return false;
    }
  }, [formData]);

  /**
   * @description Moves to the next step if validation passes.
   */
  const nextStep = useCallback(() => {
    if (!validateStep(currentStep)) {
      setError('Please complete all required fields before continuing.');
      return false;
    }

    const steps: WizardStep[] = [WizardStep.UPLOAD, WizardStep.SIGNERS, WizardStep.CONFIGURE, WizardStep.REVIEW];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      setError(null);
      return true;
    }
    return false;
  }, [currentStep, validateStep]);

  /**
   * @description Moves to the previous step.
   */
  const previousStep = useCallback(() => {
    const steps: WizardStep[] = [WizardStep.UPLOAD, WizardStep.SIGNERS, WizardStep.CONFIGURE, WizardStep.REVIEW];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      setError(null);
    }
  }, [currentStep]);

  /**
   * @description Jumps to a specific step.
   */
  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
    setError(null);
  }, []);

  /**
   * @description Resets the wizard to initial state.
   */
  const reset = useCallback(() => {
    setCurrentStep(WizardStep.UPLOAD);
    setFormData(initialFormData);
    setIsLoading(false);
    setError(null);
  }, []);

  /**
   * @description Sets loading state.
   */
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  /**
   * @description Sets error message.
   */
  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
  }, []);

  return {
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
    validateStep,
    nextStep,
    previousStep,
    goToStep,
    reset,
    setLoading,
    setError: setErrorState,
  };
}

