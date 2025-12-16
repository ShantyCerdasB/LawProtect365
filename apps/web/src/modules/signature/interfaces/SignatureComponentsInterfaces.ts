/**
 * @fileoverview Signature Components Interfaces - Interfaces for signature components
 * @summary Type definitions for signature component props and data structures
 * @description
 * Defines interfaces for signature-related components to keep component files clean
 * and improve code organization.
 */

import { SignerStatus, EnvelopeStatus } from '@lawprotect/frontend-core';
import type { EmailCheckResult } from '../../documents/interfaces/DocumentsHooksInterfaces';

/**
 * @description Signer data structure for display purposes.
 */
export interface SignerData {
  /**
   * @description Signer ID.
   */
  id: string;
  /**
   * @description Signer email.
   */
  email?: string;
  /**
   * @description Signer full name.
   */
  fullName?: string;
  /**
   * @description Whether signer is external.
   */
  isExternal?: boolean;
  /**
   * @description Signer status.
   */
  status: SignerStatus | string;
  /**
   * @description Signing order.
   */
  order?: number;
  /**
   * @description When signer signed (if signed).
   */
  signedAt?: string;
  /**
   * @description When signer declined (if declined).
   */
  declinedAt?: string;
  /**
   * @description Decline reason (if declined).
   */
  declineReason?: string;
  /**
   * @description User ID (for internal signers).
   */
  userId?: string;
}

/**
 * @description Props for SignersList component.
 */
export interface SignersListProps {
  /**
   * @description List of signers to display.
   */
  signers: SignerData[];
  /**
   * @description Whether to show actions (optional).
   */
  showActions?: boolean;
  /**
   * @description Callback when action is clicked (optional).
   */
  onAction?: (signerId: string, action: string) => void;
  /**
   * @description Empty state message.
   */
  emptyMessage?: string;
}

/**
 * @description Props for EnvelopeStatusBadge component.
 */
export interface EnvelopeStatusBadgeProps {
  /**
   * @description Envelope status.
   */
  status: EnvelopeStatus | string;
  /**
   * @description Optional custom className.
   */
  className?: string;
}

/**
 * @description Signer data for invitation.
 */
export interface InviteSignerData {
  /**
   * @description Signer email address.
   */
  email: string;
  /**
   * @description Signer full name.
   */
  fullName: string;
  /**
   * @description Whether the signer is external.
   */
  isExternal: boolean;
  /**
   * @description Optional signing order.
   */
  order?: number;
  /**
   * @description Optional user ID for internal signers.
   */
  userId?: string;
}

/**
 * @description Props for InviteSignerModal component.
 */
export interface InviteSignerModalProps {
  /**
   * @description Whether the modal is open.
   */
  isOpen: boolean;
  /**
   * @description Callback when modal should be closed.
   */
  onClose: () => void;
  /**
   * @description Callback when signer is invited.
   */
  onInvite: (signer: InviteSignerData) => void;
  /**
   * @description Whether the invitation is in progress.
   */
  isLoading?: boolean;
  /**
   * @description Optional callback to check if email is internal user.
   */
  checkEmailExists?: (email: string) => Promise<EmailCheckResult>;
}

