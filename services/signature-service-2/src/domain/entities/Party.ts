
/**
 * @file Party entity.
 * @description Represents a signer, viewer, or approver participating in an envelope.
 */

import { EnvelopeId, PartyId } from "../value-objects";
import { PartyRole, PartyStatus, AuthMethod } from "../values/enums";
import type { SignatureContext } from "../value-objects/security/SignatureContext";


/**
 * @description Authentication configuration for party.
 * Defines how the party should authenticate.
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
  /** Optional invitation timestamp (ISO 8601) */
  readonly invitedAt?: string;
  /** Optional consent timestamp (ISO 8601) */
  readonly consentedAt?: string;
  /** Optional signature completion timestamp (ISO 8601) */
  readonly signedAt?: string;
  /** Optional signature data (base64 encoded) */
  readonly signature?: string;
  /** Optional digest of the signed document */
  readonly digest?: string;
  /** Optional signing algorithm used */
  readonly algorithm?: string;
  /** Optional KMS key ID used for signing */
  readonly keyId?: string;
  /** Optional signing context for legal compliance and audit trail */
  readonly signingContext?: SignatureContext;
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
}

