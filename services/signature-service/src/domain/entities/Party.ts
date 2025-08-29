/**
 * @file Party.ts
 * @summary Party domain entity for envelope participants
 * @description Party domain entity representing signers, viewers, or approvers participating in envelopes.
 * Contains party information, authentication state, and participation metadata for signature workflows.
 */

/**
 * @file Party entity.
 * @description Represents a signer, viewer, or approver participating in an envelope.
 */

import { OtpChannel, PartyRole, PartyStatus } from "../values/enums";

/**
 * @description OTP state for party authentication.
 * Manages one-time password authentication including code hash, delivery channel, and attempt tracking.
 */
export interface OtpState {
  /** Hashed OTP code for secure storage */
  codeHash: string;
  /** Delivery channel (email or SMS) */
  channel: OtpChannel
  /** Expiration timestamp (ISO 8601) */
  expiresAt: string;
  /** Number of attempts made */
  tries: number;
  /** Maximum allowed attempts */
  maxTries: number;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
}

/**
 * @description Party domain entity representing a participant in an envelope.
 * Contains party identification, role, status, and authentication information.
 */
export interface Party {
  /** Tenant identifier */
  tenantId: string;
  /** Unique identifier of the party */
  partyId: string;
  /** Envelope the party belongs to */
  envelopeId: string;
  /** Full name of the party */
  name: string;
  /** Email address of the party */
  email: string;
  /** Functional role within the envelope */
  role: PartyRole;
  /** Current status of the party */
  status: PartyStatus;
  /** Invitation timestamp (ISO 8601) */
  invitedAt: string;
  /** Optional signature completion timestamp (ISO 8601) */
  signedAt?: string;
  /**
   * Signing sequence number used for ordered flows.
   * Must be a positive integer when the party participates in signing/approval.
   * Ignored for viewers.
   */
  sequence: number;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  /** Optional OTP state for authentication */
  otpState?: OtpState;
}
