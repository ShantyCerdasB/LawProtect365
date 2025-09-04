/**
 * @file PartiesTypes.ts
 * @summary Domain types and mapping functions for parties
 * @description Defines party-specific types and utility functions
 */

import { PartyRole } from "@/domain/value-objects";
import type { Party } from "../../../domain/entities/Party";
import type { TenantId, EnvelopeId, PartyId } from "../../../domain/value-objects/Ids";
import { PartyStatus } from "@/domain/values/enums";

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * @summary Party row type for application services
 * @description Simplified party representation for app services
 */
export interface PartyRow {
  tenantId: TenantId;
  /** Party identifier */
  readonly partyId: PartyId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Party name */
  readonly name: string;
  /** Party email address */
  readonly email: string;
  /** Party role in the envelope */
  readonly role: PartyRole;
  /** Current party status */
  readonly status: PartyStatus;
  /** Sequence number for signing order */
  readonly sequence: number;
  /** When the party was invited */
  readonly invitedAt: string;
  /** When the party signed (optional) */
  readonly signedAt?: string;
  /** When the party was created */
  readonly createdAt: string;
  /** When the party was last updated */
  readonly updatedAt: string;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

/**
 * @summary Maps Party domain entity to PartyRow
 * @description Converts a Party domain entity to a simplified row representation
 */
export const toPartyRow = (party: Party): PartyRow => ({
  tenantId: party.tenantId,
  partyId: party.partyId,
  envelopeId: party.envelopeId,
  name: party.name,
  email: party.email,
  role: party.role,
  status: party.status,
  sequence: party.sequence,
  invitedAt: party.invitedAt,
  signedAt: party.signedAt,
  createdAt: party.createdAt,
  updatedAt: party.updatedAt,
});

/**
 * @summary Maps PartyRow to Party domain entity
 * @description Converts a PartyRow back to a Party domain entity
 */
export const fromPartyRow = (row: PartyRow): Party => ({
  tenantId: row.tenantId as TenantId, // This will be injected by the service
  partyId: row.partyId,
  envelopeId: row.envelopeId,
  name: row.name,
  email: row.email,
  role: row.role,
  status: row.status,
  invitedAt: row.invitedAt,
  signedAt: row.signedAt,
  sequence: row.sequence,
  auth: { methods: ["otpViaEmail"] }, // Default auth
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  otpState: undefined, // Default OTP state
});

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * @summary Type guard for PartyRow
 * @description Checks if an object is a valid PartyRow
 */
export const isPartyRow = (obj: unknown): obj is PartyRow => {
  const row = obj as Partial<PartyRow>;
  return Boolean(
    row &&
      typeof row.partyId === "string" &&
      typeof row.envelopeId === "string" &&
      typeof row.name === "string" &&
      typeof row.email === "string" &&
      typeof row.role === "string" &&
      typeof row.status === "string" &&
      typeof row.sequence === "number" &&
      typeof row.invitedAt === "string" &&
      typeof row.createdAt === "string" &&
      typeof row.updatedAt === "string"
  );
};

// ============================================================================
// RATE LIMITING TYPES
// ============================================================================

/**
 * @summary Configuration for party rate limiting
 * @description Defines limits and time windows for party creation rate limiting
 */
export interface PartiesRateLimitConfig {
  /** Maximum parties per envelope per window */
  maxPartiesPerEnvelope: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** TTL for rate limit records in seconds */
  ttlSeconds: number;
}
