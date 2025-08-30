/**
 * @file MakeGlobalPartiesQueriesPort.ts
 * @summary Adapter factory for Global Parties Queries Port
 * @description Creates GlobalPartiesQueriesPort implementation using DynamoDB repository.
 * Handles list, get by ID, and search operations for Global Parties (contacts).
 */

import type { GlobalPartiesQueriesPort } from "@/app/ports/global-parties";
import type { GlobalPartyRepository } from "@/infra/repos/GlobalPartyRepository";
import type { 
  ListGlobalPartiesQuery, 
  ListGlobalPartiesResult,
  GetGlobalPartyQuery,
  GetGlobalPartyResult,
  SearchGlobalPartiesByEmailQuery,
  SearchGlobalPartiesByEmailResult
} from "@/app/ports/global-parties";

/**
 * @description Dependencies for the Global Parties Queries adapter.
 */
export interface MakeGlobalPartiesQueriesPortDeps {
  globalParties: GlobalPartyRepository;
}

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
    async list(query: ListGlobalPartiesQuery): Promise<ListGlobalPartiesResult> {
      // TODO: Implement proper filtering and pagination when repository is available
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

      return {
        globalParties: globalParties.items,
        nextCursor: globalParties.nextCursor,
        total: globalParties.total,
      };
    },

    async getById(query: GetGlobalPartyQuery): Promise<GetGlobalPartyResult> {
      const globalParty = await deps.globalParties.getById(query.globalPartyId);
      
      // Filter by tenant for security
      if (globalParty && globalParty.tenantId !== query.tenantId) {
        return { globalParty: null };
      }

      return { globalParty };
    },

    async searchByEmail(query: SearchGlobalPartiesByEmailQuery): Promise<SearchGlobalPartiesByEmailResult> {
      // TODO: Implement email search when repository supports it
      const globalParties = await deps.globalParties.searchByEmail({
        tenantId: query.tenantId,
        email: query.email,
        limit: query.limit || 10,
      });

      return { globalParties };
    },
  };
};
