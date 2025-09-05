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
} from "../../../shared/types/global-parties";

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
      const globalParties = await deps.globalParties.list({
        tenantId: query.tenantId,
        search: query.search,
        tags: query.tags,
        role: query.role,
        source: query.source,
        status: query.status,
        limit: query.limit || 20,
        cursor: query.cursor,
      });

      return globalParties;
    },

    async getById(query: GetGlobalPartyAppInput): Promise<GetGlobalPartyAppResult> {
      const globalParty = await deps.globalParties.getById(query.tenantId, query.partyId);
      
      // Filter by tenant for security
      if (globalParty && globalParty.tenantId !== query.tenantId) {
        return { party: null };
      }

      return { party: globalParty };
    },

    async searchByEmail(query: SearchGlobalPartiesByEmailAppInput): Promise<SearchGlobalPartiesByEmailAppResult> {
      const globalParties = await deps.globalParties.searchByEmail({
        tenantId: query.tenantId,
        email: query.email,
        limit: query.limit || 10,
      });

      return globalParties;
    },
  };
};



