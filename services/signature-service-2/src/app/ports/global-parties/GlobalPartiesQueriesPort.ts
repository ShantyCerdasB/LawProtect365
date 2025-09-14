/**
 * @file GlobalPartiesQueriesPort.ts
 * @summary Queries port for Global Parties (contacts)
 * @description Queries port for reading Global Party data (list, search, get by ID).
 * Defines the contract for Global Party query operations.
 */

import type { 
  ListGlobalPartiesAppInput,
  ListGlobalPartiesAppResult,
  SearchGlobalPartiesByEmailAppInput,
  SearchGlobalPartiesByEmailAppResult,
  GetGlobalPartyAppInput,
  GetGlobalPartyAppResult
} from "../../../domain/types/global-parties";

/**
 * @summary Queries port for Global Party operations
 * @description Defines the contract for Global Party query operations including list, get by ID, and search
 */
export interface GlobalPartiesQueriesPort {
  /**
   * @summary Lists Global Parties with optional filters
   * @description Lists Global Parties with optional filters and pagination
   * @param query - The list query parameters
   * @returns Promise resolving to paginated list of Global Parties
   */
  list(query: ListGlobalPartiesAppInput): Promise<ListGlobalPartiesAppResult>;

  /**
   * @summary Gets a Global Party by ID
   * @description Retrieves a specific Global Party by its unique identifier
   * @param query - The get by ID query parameters
   * @returns Promise resolving to the Global Party or null if not found
   */
  getById(query: GetGlobalPartyAppInput): Promise<GetGlobalPartyAppResult>;

  /**
   * @summary Searches Global Parties by email
   * @description Searches Global Parties by email address with optional filters
   * @param query - The search query parameters
   * @returns Promise resolving to search results
   */
  searchByEmail(query: SearchGlobalPartiesByEmailAppInput): Promise<SearchGlobalPartiesByEmailAppResult>;
};
