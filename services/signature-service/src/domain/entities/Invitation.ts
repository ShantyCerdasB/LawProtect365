/**
 * @file Invitation.ts
 * @summary Domain entity for invitation management
 * @description Defines the Invitation entity for managing document signing invitations
 */

import { InvitationStatus, InvitationRole } from "../values/enums";

/**
 * @summary Invitation domain entity
 * @description Represents an invitation sent to a user to sign or view a document
 */
export interface Invitation {
  /** Unique identifier for the invitation */
  invitationId: string;
  
  /** ID of the envelope this invitation is for */
  envelopeId: string;
  
  /** Email address of the invited user */
  email: string;
  
  /** Optional name of the invited user */
  name?: string;
  
  /** Role assigned to the invited user (signer or viewer) */
  role: InvitationRole;
  
  /** Unique token for accessing the invitation */
  token: string;
  
  /** Expiration date of the invitation */
  expiresAt: Date;
  
  /** Current status of the invitation */
  status: InvitationStatus;
  
  /** When the invitation was created */
  createdAt: Date;
  
  /** When the invitation was used (if applicable) */
  usedAt?: Date;
}

/**
 * @summary Invitation creation input
 * @description Input for creating a new invitation
 */
export interface CreateInvitationInput {
  envelopeId: string;
  email: string;
  name?: string;
  role: InvitationRole;
  ownerEmail: string;
}

/**
 * @summary Invitation update input
 * @description Input for updating an existing invitation
 */
export interface UpdateInvitationInput {
  invitationId: string;
  status?: InvitationStatus;
  usedAt?: Date;
}

/**
 * @summary Invitation query input
 * @description Input for querying invitations
 */
export interface InvitationQueryInput {
  envelopeId?: string;
  email?: string;
  status?: InvitationStatus;
  token?: string;
}
