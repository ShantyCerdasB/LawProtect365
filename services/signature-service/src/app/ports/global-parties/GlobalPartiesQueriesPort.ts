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
 * @description Queries port for Global Party operations.
 */
export interface GlobalPartiesQueriesPort {
  /**
   * Lists Global Parties with optional filters.
   */
  list(query: ListGlobalPartiesAppInput): Promise<ListGlobalPartiesAppResult>;

  /**
   * Gets a Global Party by ID.
   */
  getById(query: GetGlobalPartyAppInput): Promise<GetGlobalPartyAppResult>;

  /**
   * Searches Global Parties by email.
   */
  searchByEmail(query: SearchGlobalPartiesByEmailAppInput): Promise<SearchGlobalPartiesByEmailAppResult>;
}









