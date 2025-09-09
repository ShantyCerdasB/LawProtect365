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
 * @summary Default implementation of PartiesQueryService
 * @description Simple wrapper around PartiesQueriesPort
 */
export class DefaultPartiesQueryService {
  constructor(private readonly queriesPort: PartiesQueriesPort) {}

  /**
   * Lists Parties in an envelope with optional filters.
   */
  async list(query: ListPartiesAppInput): Promise<ListPartiesAppResult> {
    return this.queriesPort.list(query);
  }

  /**
   * Gets a Party by ID.
   */
  async getById(query: GetPartyAppInput): Promise<GetPartyAppResult> {
    return this.queriesPort.getById(query);
  }

  /**
   * Searches Parties by email in an envelope.
   */
  async searchByEmail(query: SearchPartiesByEmailAppInput): Promise<SearchPartiesByEmailAppResult> {
    return this.queriesPort.searchByEmail(query);
  }
}






