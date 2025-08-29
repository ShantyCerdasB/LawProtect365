/**
 * @file Party entity.
 * @description Represents a signer, viewer, or approver participating in an envelope.
 */

export type PartyRole = "signer" | "viewer" | "approver";
export type PartyStatus = "pending" | "signed" | "declined";

/**
 * OTP state for party authentication.
 */
export interface OtpState {
  /** Hashed OTP code for secure storage. */
  codeHash: string;
  /** Delivery channel (email or SMS). */
  channel: "email" | "sms";
  /** Expiration timestamp (ISO 8601). */
  expiresAt: string;
  /** Number of attempts made. */
  tries: number;
  /** Maximum allowed attempts. */
  maxTries: number;
  /** Creation timestamp (ISO 8601). */
  createdAt: string;
}

/**
 * Party domain entity.
 */
export interface Party {
  tenantId: string;
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
  /** Invitation timestamp (ISO 8601). */
  invitedAt: string;
  /** Optional signature completion timestamp (ISO 8601). */
  signedAt?: string;
  /**
   * Signing sequence number used for ordered flows.
   * Must be a positive integer when the party participates in signing/approval.
   * Ignored for viewers.
   */
  sequence: number;
  /** Creation timestamp (ISO 8601). */
  createdAt: string;
  updatedAt: string;
  /** Optional OTP state for authentication. */
  otpState?: OtpState;
}
