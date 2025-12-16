/**
 * @fileoverview Wizard Components Interfaces - Interfaces for wizard step components
 * @summary Type definitions for wizard step component props
 * @description
 * Defines interfaces for all wizard step components to keep component files clean
 * and improve code organization.
 */

import { WizardStep, SigningOrderType, DocumentOriginType } from '@lawprotect/frontend-core';
import type { WizardSigner, WizardFormData, WizardConfig } from '../types/CreateEnvelopeWizard';

/**
 * @description Props for WizardStepUpload component.
 */
export interface WizardStepUploadProps {
  /**
   * @description Currently uploaded PDF file.
   */
  pdfFile: File | null;
  /**
   * @description Callback when PDF is uploaded.
   */
  onUpload: (file: File, source: ArrayBuffer) => Promise<void>;
  /**
   * @description Whether upload is in progress.
   */
  isLoading: boolean;
  /**
   * @description Callback when origin type changes.
   */
  onOriginTypeChange: (type: DocumentOriginType, templateId?: string, templateVersion?: string) => void;
}

/**
 * @description Props for WizardStepSigners component.
 */
export interface WizardStepSignersProps {
  /**
   * @description List of signers.
   */
  signers: WizardSigner[];
  /**
   * @description Callback to add a new signer.
   */
  onAddSigner: (signer: WizardSigner) => void;
  /**
   * @description Callback to remove a signer.
   */
  onRemoveSigner: (index: number) => void;
  /**
   * @description Callback to update a signer.
   */
  onUpdateSigner: (index: number, signer: Partial<WizardSigner>) => void;
}

/**
 * @description Props for WizardStepConfigure component.
 */
export interface WizardStepConfigureProps {
  /**
   * @description Current configuration.
   */
  config: WizardConfig;
  /**
   * @description Callback to update configuration.
   */
  onUpdateConfig: (config: Partial<WizardConfig>) => void;
  /**
   * @description Current signing order type.
   */
  signingOrderType: SigningOrderType;
}

/**
 * @description Props for WizardStepReview component.
 */
export interface WizardStepReviewProps {
  /**
   * @description Complete form data to review.
   */
  formData: WizardFormData;
  /**
   * @description Callback to edit a specific step.
   */
  onEditStep: (step: WizardStep) => void;
}

