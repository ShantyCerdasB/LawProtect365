/**
 * @file MakeGlobalPartiesQueriesPort.ts
 * @summary Adapter factory for Global Parties Queries Port
 * @description Creates GlobalPartiesQueriesPort implementation using DynamoDB repository.
 * Handles list, get by ID, and search operations for Global Parties (contacts).
 */

import type { GlobalPartiesQueriesPort } from "../../ports/global-parties";
import type { 
  ListGlobalPartiesAppInput, 
  ListGlobalPartiesAppResult,
  GetGlobalPartyAppInput,
  GetGlobalPartyAppResult,
  SearchGlobalPartiesByEmailAppInput,
  SearchGlobalPartiesByEmailAppResult,
  MakeGlobalPartiesQueriesPortDeps
} from "../../../domain/types/global-parties";
import { PAGINATION_LIMITS } from "@/domain/values/enums";

/**
 * @description Creates GlobalPartiesQueriesPort implementation.
 * 
 * @param deps - Dependencies for the adapter
 * @returns GlobalPartiesQueriesPort implementation
 */
export const makeGlobalPartiesQueriesPort = (
  deps: MakeGlobalPartiesQueriesPortDeps
): GlobalPartiesQueriesPort => {
  return {
    async list(query: ListGlobalPartiesAppInput): Promise<ListGlobalPartiesAppResult> {
      // Apply generic rules
      const globalParties = await deps.globalParties.list({
        search: query.search,
        tags: query.tags,
        role: query.role,
        source: query.source,
        status: query.status,
        limit: query.limit ?? PAGINATION_LIMITS.DEFAULT_LIMIT,
        cursor: query.cursor});

      return globalParties;
    },

    async getById(query: GetGlobalPartyAppInput): Promise<GetGlobalPartyAppResult> {
      // Apply generic rules
      const globalParty = await deps.globalParties.getById(query.partyId);
      
      // Filter by tenant for security
      if (globalParty && globalParty !== query) {
        return { party: null };
      }

      return { party: globalParty };
    },

    async searchByEmail(query: SearchGlobalPartiesByEmailAppInput): Promise<SearchGlobalPartiesByEmailAppResult> {
      // Apply generic rules
      const globalParties = await deps.globalParties.searchByEmail({
        email: query.email,
        limit: query.limit ?? PAGINATION_LIMITS.DEFAULT_LIMIT});

      return globalParties;
    }};
};
