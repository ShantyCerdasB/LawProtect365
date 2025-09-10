/**
 * @file AppServiceInputs.ts
 * @summary Inputs and outputs for party app services
 * @description Defines the input/output contracts for party application services
 */

import type { EnvelopeId, PartyId } from "@/domain/value-objects/ids";
import type { Party } from "../../../domain/entities/Party";
import { PartyRole, PartyStatus } from "@/domain/values/enums";

// ============================================================================
// LIST PARTIES
// ============================================================================

/**
 * @summary Input for listing parties in an envelope
 * @description Parameters for listing parties with optional filtering
 */
export interface ListPartiesAppInput {
  /** Tenant identifier */
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Optional role filter */
  readonly role?: PartyRole;
  /** Optional status filter */
  readonly status?: PartyStatus;
  /** Maximum number of items to return */
  readonly limit?: number;
  /** Pagination cursor */
  readonly cursor?: string;
}

/**
 * @summary Result of listing parties
 * @description Contains the list of parties and pagination information
 */
export interface ListPartiesAppResult {
  /** Array of party entities */
  readonly parties: Party[];
  /** Pagination cursor for next page */
  readonly nextCursor?: string;
  /** Total count of parties */
  readonly total: number;
}

// ============================================================================
// GET PARTY BY ID
// ============================================================================

/**
 * @summary Input for getting a party by ID
 * @description Parameters for retrieving a specific party
 */
export interface GetPartyAppInput {
  /** Tenant identifier */
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Party identifier */
  readonly partyId: PartyId;
}

/**
 * @summary Result of getting a party by ID
 * @description Contains the party entity or null if not found
 */
export interface GetPartyAppResult {
  /** Party entity or null if not found */
  readonly party: Party | null;
}

// ============================================================================
// SEARCH PARTIES BY EMAIL
// ============================================================================

/**
 * @summary Input for searching parties by email
 * @description Parameters for finding parties by email address
 */
export interface SearchPartiesByEmailAppInput {
  /** Tenant identifier */
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Email address to search for */
  readonly email: string;
}

/**
 * @summary Result of searching parties by email
 * @description Contains the list of parties matching the email
 */
export interface SearchPartiesByEmailAppResult {
  /** Array of party entities matching the email */
  readonly parties: Party[];
}

