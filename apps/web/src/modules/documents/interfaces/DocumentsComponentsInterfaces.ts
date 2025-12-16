/**
 * @fileoverview Documents Components Interfaces - Interfaces for documents components
 * @summary Type definitions for documents component props
 * @description
 * Defines interfaces for documents-related components to keep component files clean
 * and improve code organization.
 */

import { SigningOrderType } from '@lawprotect/frontend-core';
import type { EmailCheckResult } from './DocumentsHooksInterfaces';

/**
 * @description Signer data structure.
 */
export interface DocumentSigner {
  /**
   * @description Signer email address.
   */
  email: string;
  /**
   * @description Signer full name.
   */
  fullName: string;
  /**
   * @description Whether signer is external (detected automatically).
   */
  isExternal: boolean;
  /**
   * @description Optional signing order.
   */
  order?: number;
  /**
   * @description Optional user ID (if internal user found).
   */
  userId?: string;
}

/**
 * @description Props for AddSignerSection component.
 */
export interface AddSignerSectionProps {
  /**
   * @description List of current signers.
   */
  signers: DocumentSigner[];
  /**
   * @description Callback when signer is added.
   */
  onAddSigner: (signer: DocumentSigner) => void;
  /**
   * @description Callback when signer is removed.
   */
  onRemoveSigner: (index: number) => void;
  /**
   * @description Callback to check if email is internal user (optional).
   */
  checkEmailExists?: (email: string) => Promise<EmailCheckResult>;
}

/**
 * @description Props for CreateEnvelopeSection component.
 */
export interface CreateEnvelopeSectionProps {
  /**
   * @description List of signers to add to envelope.
   */
  signers: DocumentSigner[];
  /**
   * @description PDF file that was edited.
   */
  pdfFile: File | null;
  /**
   * @description Modified PDF as ArrayBuffer.
   */
  pdfSource: ArrayBuffer | null;
  /**
   * @description Callback when envelope should be created.
   */
  onCreateEnvelope: (data: {
    title: string;
    description?: string;
    signingOrderType: SigningOrderType;
    expiresAt?: string;
    signers: DocumentSigner[];
  }) => Promise<void>;
  /**
   * @description Whether creation is in progress.
   */
  isLoading?: boolean;
}

