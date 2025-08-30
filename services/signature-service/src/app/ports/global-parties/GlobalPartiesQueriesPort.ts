/**
 * @file GlobalPartiesQueriesPort.ts
 * @summary Queries port for Global Parties (contacts)
 * @description Queries port for reading Global Party data (list, search, get by ID).
 * Defines the contract for Global Party query operations.
 */

import type { TenantId } from "../shared";
import type { GlobalParty } from "@/domain/entities/GlobalParty";
import type { GlobalPartyStatus, PartyRole, PartySource } from "@/domain/values/enums";

/**
 * @description Input for listing Global Parties with filters.
 */
export interface ListGlobalPartiesQuery {
  tenantId: TenantId;
  search?: string;
  tags?: string[];
  role?: PartyRole;
  source?: PartySource;
  status?: GlobalPartyStatus;
  limit?: number;
  cursor?: string;
}

/**
 * @description Result of listing Global Parties.
 */
export interface ListGlobalPartiesResult {
  globalParties: GlobalParty[];
  nextCursor?: string;
  total: number;
}

/**
 * @description Input for getting a Global Party by ID.
 */
export interface GetGlobalPartyQuery {
  tenantId: TenantId;
  globalPartyId: string;
}

/**
 * @description Result of getting a Global Party.
 */
export interface GetGlobalPartyResult {
  globalParty: GlobalParty | null;
}

/**
 * @description Input for searching Global Parties by email.
 */
export interface SearchGlobalPartiesByEmailQuery {
  tenantId: TenantId;
  email: string;
  limit?: number;
}

/**
 * @description Result of searching Global Parties by email.
 */
export interface SearchGlobalPartiesByEmailResult {
  globalParties: GlobalParty[];
}

/**
 * @description Queries port for Global Party operations.
 */
export interface GlobalPartiesQueriesPort {
  /**
   * Lists Global Parties with optional filters.
   */
  list(query: ListGlobalPartiesQuery): Promise<ListGlobalPartiesResult>;

  /**
   * Gets a Global Party by ID.
   */
  getById(query: GetGlobalPartyQuery): Promise<GetGlobalPartyResult>;

  /**
   * Searches Global Parties by email.
   */
  searchByEmail(query: SearchGlobalPartiesByEmailQuery): Promise<SearchGlobalPartiesByEmailResult>;
}



