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
} from "../../../shared/types/parties";

/**
 * @description Queries port for Party operations.
 */
export interface PartiesQueriesPort {
  /**
   * Lists Parties in an envelope with optional filters.
   */
  list(query: ListPartiesAppInput): Promise<ListPartiesAppResult>;

  /**
   * Gets a Party by ID.
   */
  getById(query: GetPartyAppInput): Promise<GetPartyAppResult>;

  /**
   * Searches Parties by email in an envelope.
   */
  searchByEmail(query: SearchPartiesByEmailAppInput): Promise<SearchPartiesByEmailAppResult>;
}
