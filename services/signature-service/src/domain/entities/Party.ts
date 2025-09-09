
/**
 * @file Party entity.
 * @description Represents a signer, viewer, or approver participating in an envelope.
 */

import { EnvelopeId, PartyId, TenantId } from "../value-objects";
import { OtpChannel, PartyRole, PartyStatus, AuthMethod } from "../values/enums";

/**
 * @description OTP state for party authentication.
 * Manages one-time password authentication including code hash, delivery channel, and attempt tracking.
 */
export interface OtpState {
  /** Hashed OTP code for secure storage */
  readonly codeHash: string;
  /** Delivery channel (email or SMS) */
  readonly channel: OtpChannel;
  /** Expiration timestamp (ISO 8601) */
  readonly expiresAt: string;
  /** Number of attempts made */
  readonly tries: number;
  /** Maximum allowed attempts */
  readonly maxTries: number;
  /** Creation timestamp (ISO 8601) */
  readonly createdAt: string;
}

/**
 * @description Authentication configuration for party.
 * Defines how the party should authenticate (OTP via email/SMS).
 */
export interface PartyAuth {
  /** Authentication methods enabled for this party */
  readonly methods: AuthMethod[];
}

/**
 * @description Party domain entity representing a participant in an envelope.
 * Contains party identification, role, status, and authentication information.
 */
export interface Party {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Unique identifier of the party */
  readonly partyId: PartyId;
  /** Envelope the party belongs to */
  readonly envelopeId: EnvelopeId;
  /** Full name of the party */
  readonly name: string;
  /** Email address of the party */
  readonly email: string;
  /** Functional role within the envelope */
  readonly role: PartyRole;
  /** Current status of the party */
  readonly status: PartyStatus;
  /** Invitation timestamp (ISO 8601) */
  readonly invitedAt: string;
  /** Optional signature completion timestamp (ISO 8601) */
  readonly signedAt?: string;
  /**
   * Signing sequence number used for ordered flows.
   * Must be a positive integer when the party participates in signing/approval.
   * Ignored for viewers.
   */
  readonly sequence: number;
  /** Optional phone number of the party */
  readonly phone?: string;
  /** Optional locale preference of the party */
  readonly locale?: string;
  /** Authentication configuration for this party */
  readonly auth: PartyAuth;
  /** Optional reference to global party (contact) */
  readonly globalPartyId?: string;
  /** Creation timestamp (ISO 8601) */
  readonly createdAt: string;
  /** Last update timestamp (ISO 8601) */
  readonly updatedAt: string;
  /** Optional OTP state for authentication (managed by Signing/Requests) */
  readonly otpState?: OtpState;
}






