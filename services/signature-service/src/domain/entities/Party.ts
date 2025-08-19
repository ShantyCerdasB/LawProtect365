/**
 * @file Party entity.
 * @description
 * Represents a signer, viewer, or other participant in an envelope.
 */

export type PartyRole = "signer" | "viewer" | "approver";
export type PartyStatus = "pending" | "signed" | "declined";

/**
 * Party domain entity.
 */
export interface Party {
  /** Unique identifier of the party. */
  partyId: string;
  /** Envelope the party belongs to. */
  envelopeId: string;
  /** Full name of the party. */
  name: string;
  /** Email address of the party. */
  email: string;
  /** Functional role within the envelope. */
  role: PartyRole;
  /** Current status of the party. */
  status: PartyStatus;
  /** Invitation timestamp (ISO8601). */
  invitedAt: string;
  /** Optional signature completion timestamp (ISO8601). */
  signedAt?: string;
  /** Creation timestamp (ISO8601). */
  createdAt: string;
}
