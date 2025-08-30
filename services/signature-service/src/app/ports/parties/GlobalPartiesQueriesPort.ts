/**
 * @file GlobalPartiesQueriesPort.ts
 * @summary Read-only global party port for controllers/use-cases
 * @description Queries port for global party (address book) read operations.
 * Handles get, list, and search operations for global parties.
 * This port is used by application services to perform read operations on global parties.
 */

import type { TenantId, PartyId } from "../shared";
import type { GlobalParty } from "../../../domain/entities/GlobalParty";
import type { DelegationRecord } from "../../../domain/value-objects/party/DelegationRecord";
import type { PartyRole, PartySource } from "../../../domain/values/enums";

/**
 * Input parameters for getting a global party by ID
 * @interface GetGlobalPartyInput
 * @description Data required to retrieve a global party by its unique identifier
 */
export interface GetGlobalPartyInput {
  /** The tenant ID that owns the party */
  tenantId: TenantId;
  /** The unique identifier of the party to retrieve */
  partyId: PartyId;
}

/**
 * Input parameters for listing global parties
 * @interface ListGlobalPartiesInput
 * @description Data required to list global parties with optional filtering and pagination
 */
export interface ListGlobalPartiesInput {
  /** The tenant ID to list parties for */
  tenantId: TenantId;
  /** Maximum number of parties to return */
  limit?: number;
  /** Pagination cursor for the next page */
  cursor?: string;
  /** Optional search term to filter parties by name or email */
  search?: string;
  /** Optional role filter to return only parties with specific role */
  role?: PartyRole;
  /** Optional source filter to return only parties from specific source */
  source?: PartySource;
}

/**
 * Result of listing global parties
 * @interface ListGlobalPartiesResult
 * @description Contains the list of parties and pagination information
 */
export interface ListGlobalPartiesResult {
  /** Array of global parties matching the criteria */
  parties: GlobalParty[];
  /** Cursor for the next page of results */
  nextCursor?: string;
  /** Total number of parties matching the criteria */
  total?: number;
}

/**
 * Input parameters for searching global parties
 * @interface SearchGlobalPartiesInput
 * @description Data required to search global parties by name or email
 */
export interface SearchGlobalPartiesInput {
  /** The tenant ID to search parties in */
  tenantId: TenantId;
  /** The search query string */
  query: string;
  /** Maximum number of parties to return */
  limit?: number;
  /** Pagination cursor for the next page */
  cursor?: string;
}

/**
 * Result of searching global parties
 * @interface SearchGlobalPartiesResult
 * @description Contains the search results and pagination information
 */
export interface SearchGlobalPartiesResult {
  /** Array of global parties matching the search query */
  parties: GlobalParty[];
  /** Cursor for the next page of results */
  nextCursor?: string;
  /** Total number of parties matching the search query */
  total?: number;
}

/**
 * Input parameters for getting delegations for a party
 * @interface GetPartyDelegationsInput
 * @description Data required to retrieve delegations for a specific party
 */
export interface GetPartyDelegationsInput {
  /** The tenant ID that owns the party */
  tenantId: TenantId;
  /** The unique identifier of the party to get delegations for */
  partyId: PartyId;
  /** Whether to include expired delegations in the results */
  includeExpired?: boolean;
}

/**
 * Result of getting delegations for a party
 * @interface GetPartyDelegationsResult
 * @description Contains the list of delegations for the party
 */
export interface GetPartyDelegationsResult {
  /** Array of delegation records for the party */
  delegations: DelegationRecord[];
}

/**
 * Input parameters for getting a delegation by ID
 * @interface GetDelegationInput
 * @description Data required to retrieve a specific delegation by its unique identifier
 */
export interface GetDelegationInput {
  /** The tenant ID that owns the delegation */
  tenantId: TenantId;
  /** The unique identifier of the delegation to retrieve */
  delegationId: string;
}

/**
 * Queries port for global party operations
 * @interface GlobalPartiesQueriesPort
 * @description Provides read operations for global parties (address book)
 * This port handles all query operations including get, list, search,
 * and delegation retrieval for global parties.
 */
export interface GlobalPartiesQueriesPort {
  /**
   * Get a global party by ID
   * @param input - The input data for retrieving a global party
   * @returns Promise resolving to the party data or null if not found
   */
  getById(input: GetGlobalPartyInput): Promise<GlobalParty | null>;

  /**
   * Find a global party by email within a tenant
   * @param input - The input data containing tenant ID and email
   * @returns Promise resolving to the party data or null if not found
   */
  findByEmail(input: { tenantId: TenantId; email: string }): Promise<GlobalParty | null>;

  /**
   * List global parties for a tenant with optional filtering
   * @param input - The input data for listing parties with filters and pagination
   * @returns Promise resolving to the list result with parties and pagination info
   */
  list(input: ListGlobalPartiesInput): Promise<ListGlobalPartiesResult>;

  /**
   * Search global parties by name or email
   * @param input - The input data for searching parties
   * @returns Promise resolving to the search result with parties and pagination info
   */
  search(input: SearchGlobalPartiesInput): Promise<SearchGlobalPartiesResult>;

  /**
   * Get delegations for a party
   * @param input - The input data for retrieving party delegations
   * @returns Promise resolving to the delegations result
   */
  getDelegations(input: GetPartyDelegationsInput): Promise<GetPartyDelegationsResult>;

  /**
   * Get a delegation by ID
   * @param input - The input data for retrieving a specific delegation
   * @returns Promise resolving to the delegation data or null if not found
   */
  getDelegation(input: GetDelegationInput): Promise<DelegationRecord | null>;

  /**
   * Check if a party has active delegations
   * @param input - The input data containing tenant ID and party ID
   * @returns Promise resolving to true if the party has active delegations, false otherwise
   */
  hasActiveDelegations(input: { tenantId: TenantId; partyId: PartyId }): Promise<boolean>;
}
