/**
 * @fileoverview AuthenticationResult - Result interface for authentication validation
 * @summary Contains authentication and authorization information
 * @description This interface defines the structure for authentication results,
 * including user information, envelope/signer IDs, and authentication method.
 */

import { InvitationToken } from '../../entities/InvitationToken';

export interface AuthenticationResult {
  /** Envelope ID */
  envelopeId: string;
  /** Signer ID */
  signerId: string;
  /** User ID */
  userId: string;
  /** User email (if available) */
  userEmail?: string;
  /** Whether this is an external user */
  isExternalUser: boolean;
  /** Invitation token (for external users) */
  invitationToken?: InvitationToken;
}
