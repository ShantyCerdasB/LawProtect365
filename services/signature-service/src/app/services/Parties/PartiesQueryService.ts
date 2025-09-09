/**
 * @file PartiesQueryService.ts
 * @summary Query service for Parties operations
 * @description Wrapper service for Party query operations
 */

import type { PartiesQueriesPort } from "../../ports/parties";
import type { 
  ListPartiesAppInput,
  ListPartiesAppResult,
  GetPartyAppInput,
  GetPartyAppResult,
  SearchPartiesByEmailAppInput,
  SearchPartiesByEmailAppResult
} from "../../../domain/types/parties";

/**
 * @summary Query service for Parties operations
 * @description Simple wrapper around PartiesQueriesPort
 */
export class PartiesQueryService {
  constructor(private readonly queriesPort: PartiesQueriesPort) {}

  /**
   * @summary Lists Parties in an envelope with optional filters
   * @param query - Query data for listing parties
   * @returns Promise resolving to paginated list of parties
   */
  async list(query: ListPartiesAppInput): Promise<ListPartiesAppResult> {
    return this.queriesPort.list(query);
  }

  /**
   * @summary Gets a Party by ID
   * @param query - Query data for getting party
   * @returns Promise resolving to party or null
   */
  async getById(query: GetPartyAppInput): Promise<GetPartyAppResult> {
    return this.queriesPort.getById(query);
  }

  /**
   * @summary Searches Parties by email in an envelope
   * @param query - Query data for searching parties
   * @returns Promise resolving to search results
   */
  async searchByEmail(query: SearchPartiesByEmailAppInput): Promise<SearchPartiesByEmailAppResult> {
    return this.queriesPort.searchByEmail(query);
  }
};
