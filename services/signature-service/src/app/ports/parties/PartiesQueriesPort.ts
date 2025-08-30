/**
 * @file PartiesQueriesPort.ts
 * @summary Queries port for envelope-scoped parties
 * @description Queries port for reading Party data within envelopes (list, get by ID).
 * Defines the contract for Party query operations.
 */

import type { TenantId, EnvelopeId } from "../shared";
import type { Party } from "@/domain/entities/Party";
import type { PartyRole, PartyStatus } from "@/domain/values/enums";

/**
 * @description Input for listing Parties in an envelope.
 */
export interface ListPartiesQuery {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  role?: PartyRole;
  status?: PartyStatus;
  limit?: number;
  cursor?: string;
}

/**
 * @description Result of listing Parties.
 */
export interface ListPartiesResult {
  parties: Party[];
  nextCursor?: string;
  total: number;
}

/**
 * @description Input for getting a Party by ID.
 */
export interface GetPartyQuery {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  partyId: string;
}

/**
 * @description Result of getting a Party.
 */
export interface GetPartyResult {
  party: Party | null;
}

/**
 * @description Input for getting Parties by email in an envelope.
 */
export interface GetPartiesByEmailQuery {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  email: string;
}

/**
 * @description Result of getting Parties by email.
 */
export interface GetPartiesByEmailResult {
  parties: Party[];
}

/**
 * @description Queries port for Party operations.
 */
export interface PartiesQueriesPort {
  /**
   * Lists Parties in an envelope with optional filters.
   */
  list(query: ListPartiesQuery): Promise<ListPartiesResult>;

  /**
   * Gets a Party by ID.
   */
  getById(query: GetPartyQuery): Promise<GetPartyResult>;

  /**
   * Gets Parties by email in an envelope.
   */
  getByEmail(query: GetPartiesByEmailQuery): Promise<GetPartiesByEmailResult>;
}
