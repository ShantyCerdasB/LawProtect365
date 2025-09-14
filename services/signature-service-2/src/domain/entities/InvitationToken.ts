/**
 * @file InvitationToken.ts
 * @summary Invitation Token entity
 * @description Represents a secure token for document signing invitations
 */

import type { EnvelopeId, PartyId } from "../value-objects/ids";

/**
 * @summary Invitation token status
 */
export type InvitationTokenStatus = "active" | "used" | "expired" | "revoked";

/**
 * @summary Invitation token entity
 * @description Represents a secure token that allows external parties to sign documents
 */
export interface InvitationToken {
  /** Unique token identifier */
  readonly tokenId: string;
  /** The actual token string used in URLs */
  readonly token: string;
  /** Envelope this token is for */
  readonly envelopeId: EnvelopeId;
  /** Party this token is for */
  readonly partyId: PartyId;
  /** Email of the invited party */
  readonly email: string;
  /** Name of the invited party */
  readonly name?: string;
  /** Role of the invited party */
  readonly role: "signer";
  /** Email of the person who created the invitation */
  readonly invitedBy: string;
  /** Name of the person who created the invitation */
  readonly invitedByName?: string;
  /** Current status of the token */
  readonly status: InvitationTokenStatus;
  /** When the token was created */
  readonly createdAt: string;
  /** When the token expires */
  readonly expiresAt: string;
  /** When the token was used (if applicable) */
  readonly usedAt?: string;
  /** IP address when token was used */
  readonly usedFromIp?: string;
  /** User agent when token was used */
  readonly usedWithUserAgent?: string;
  /** Custom message for the invitation */
  readonly message?: string;
  /** Deadline for signing */
  readonly signByDate?: string;
  /** Signing order preference */
  readonly signingOrder?: "owner_first" | "invitees_first";
}

/**
 * @summary Input for creating a new invitation token
 */
export interface CreateInvitationTokenInput {
  readonly envelopeId: EnvelopeId;
  readonly partyId: PartyId;
  readonly email: string;
  readonly name?: string;
  readonly role: "signer";
  readonly invitedBy: string;
  readonly invitedByName?: string;
  readonly message?: string;
  readonly signByDate?: string;
  readonly signingOrder?: "owner_first" | "invitees_first";
  readonly expiresInDays?: number;
}

/**
 * @summary Input for updating an invitation token
 */
export interface UpdateInvitationTokenInput {
  readonly tokenId: string;
  readonly status?: InvitationTokenStatus;
  readonly usedAt?: string;
  readonly usedFromIp?: string;
  readonly usedWithUserAgent?: string;
}
