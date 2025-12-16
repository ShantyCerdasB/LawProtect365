/**
 * @fileoverview Create Envelope Wizard Types - Types for envelope creation wizard
 * @summary Type definitions for the multi-step envelope creation wizard
 * @description
 * Defines the types and interfaces for the envelope creation wizard flow,
 * including step management, form data, and validation states.
 */

import { DocumentOriginType, SigningOrderType, WizardStep } from '@lawprotect/frontend-core';
import type { SignerWithFields } from '@lawprotect/frontend-core';

/**
 * @description Signer data for the wizard (extends SignerWithFields).
 */
export type WizardSigner = SignerWithFields;

/**
 * @description Configuration data for envelope creation.
 */
export interface WizardConfig {
  /**
   * @description Envelope title.
   */
  title: string;
  /**
   * @description Envelope description.
   */
  description?: string;
  /**
   * @description Signing order type.
   */
  signingOrderType: SigningOrderType;
  /**
   * @description Expiration date (ISO string).
   */
  expiresAt?: string;
}

/**
 * @description Complete wizard form data.
 */
export interface WizardFormData {
  /**
   * @description Uploaded PDF file.
   */
  pdfFile: File | null;
  /**
   * @description PDF file as ArrayBuffer for processing.
   */
  pdfSource: ArrayBuffer | null;
  /**
   * @description S3 key for uploaded document (after upload).
   */
  sourceKey: string | null;
  /**
   * @description S3 key for metadata (after upload).
   */
  metaKey: string | null;
  /**
   * @description List of signers to add.
   */
  signers: WizardSigner[];
  /**
   * @description Envelope configuration.
   */
  config: WizardConfig;
  /**
   * @description Document origin type.
   */
  originType: DocumentOriginType;
  /**
   * @description Template ID (if using template).
   */
  templateId?: string;
  /**
   * @description Template version (if using template).
   */
  templateVersion?: string;
}

/**
 * @description Wizard state and navigation.
 */
export interface WizardState {
  /**
   * @description Current step in the wizard.
   */
  currentStep: WizardStep;
  /**
   * @description Form data collected across steps.
   */
  formData: WizardFormData;
  /**
   * @description Whether the wizard is in a loading state.
   */
  isLoading: boolean;
  /**
   * @description Error message if any.
   */
  error: string | null;
}

