/**
 * @file PartiesQueriesPort.ts
 * @summary Queries port for envelope-scoped parties
 * @description Queries port for reading Party data within envelopes (list, get by ID, search by email).
 * Defines the contract for Party query operations.
 */

import type { 
  ListPartiesAppInput,
  ListPartiesAppResult,
  SearchPartiesByEmailAppInput,
  SearchPartiesByEmailAppResult,
  GetPartyAppInput,
  GetPartyAppResult
} from "../../../domain/types/parties";

/**
 * @summary Queries port for Party operations
 * @description Defines the contract for Party query operations including list, get by ID, and search
 */
export interface PartiesQueriesPort {
  /**
   * @summary Lists Parties in an envelope with optional filters
   * @description Lists Parties in an envelope with optional filters and pagination
   * @param query - The list query parameters
   * @returns Promise resolving to paginated list of Parties
   */
  list(query: ListPartiesAppInput): Promise<ListPartiesAppResult>;

  /**
   * @summary Gets a Party by ID
   * @description Retrieves a specific Party by its unique identifier
   * @param query - The get by ID query parameters
   * @returns Promise resolving to the Party or null if not found
   */
  getById(query: GetPartyAppInput): Promise<GetPartyAppResult>;

  /**
   * @summary Searches Parties by email in an envelope
   * @description Searches Parties by email address within an envelope
   * @param query - The search query parameters
   * @returns Promise resolving to search results
   */
  searchByEmail(query: SearchPartiesByEmailAppInput): Promise<SearchPartiesByEmailAppResult>;
};
