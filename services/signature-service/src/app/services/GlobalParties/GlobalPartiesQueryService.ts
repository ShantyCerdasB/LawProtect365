/**
 * @file GlobalPartiesQueryService.ts
 * @summary Query service for Global Parties operations
 * @description Wrapper service for Global Party query operations
 */

import type { GlobalPartiesQueriesPort } from "../../ports/global-parties";
import type { 
  ListGlobalPartiesAppInput,
  ListGlobalPartiesAppResult,
  GetGlobalPartyAppInput,
  GetGlobalPartyAppResult,
  SearchGlobalPartiesByEmailAppInput,
  SearchGlobalPartiesByEmailAppResult
} from "../../../shared/types/global-parties";
import type { GlobalPartiesQueryService } from "../../../shared/types/global-parties/ServiceInterfaces";

/**
 * @description Default implementation of GlobalPartiesQueryService
 */
export class DefaultGlobalPartiesQueryService implements GlobalPartiesQueryService {
  constructor(private readonly queriesPort: GlobalPartiesQueriesPort) {}

  async list(input: ListGlobalPartiesAppInput): Promise<ListGlobalPartiesAppResult> {
    return this.queriesPort.list(input);
  }

  async getById(input: GetGlobalPartyAppInput): Promise<GetGlobalPartyAppResult> {
    return this.queriesPort.getById(input);
  }

  async searchByEmail(input: SearchGlobalPartiesByEmailAppInput): Promise<SearchGlobalPartiesByEmailAppResult> {
    return this.queriesPort.searchByEmail(input);
  }
}

