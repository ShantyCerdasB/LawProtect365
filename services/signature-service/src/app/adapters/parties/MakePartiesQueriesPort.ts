/**
 * @file MakePartiesQueriesPort.ts
 * @summary Adapter factory for Parties Queries Port
 * @description Creates PartiesQueriesPort implementation using DynamoDB repository.
 * Handles list, get by ID, and get by email operations for envelope-scoped Parties.
 */

import type { PartiesQueriesPort } from "@/app/ports/parties";
import type { PartyRepository } from "@/infra/repos/PartyRepository";
import type { 
  ListPartiesQuery, 
  ListPartiesResult,
  GetPartyQuery,
  GetPartyResult,
  GetPartiesByEmailQuery,
  GetPartiesByEmailResult
} from "@/app/ports/parties";

/**
 * @description Dependencies for the Parties Queries adapter.
 */
export interface MakePartiesQueriesPortDeps {
  parties: PartyRepository;
}

/**
 * @description Creates PartiesQueriesPort implementation.
 * 
 * @param deps - Dependencies for the adapter
 * @returns PartiesQueriesPort implementation
 */
export const makePartiesQueriesPort = (
  deps: MakePartiesQueriesPortDeps
): PartiesQueriesPort => {
  return {
    async list(query: ListPartiesQuery): Promise<ListPartiesResult> {
      // TODO: Implement proper filtering and pagination when repository is available
      const parties = await deps.parties.listByEnvelope({
        tenantId: query.tenantId,
        envelopeId: query.envelopeId,
        role: query.role,
        status: query.status,
        limit: query.limit || 20,
        cursor: query.cursor,
      });

      return {
        parties: parties.items,
        nextCursor: parties.nextCursor,
        total: parties.total,
      };
    },

    async getById(query: GetPartyQuery): Promise<GetPartyResult> {
      const party = await deps.parties.getById(query.partyId, query.envelopeId);
      
      // Filter by tenant for security
      if (party && party.tenantId !== query.tenantId) {
        return { party: null };
      }

      return { party };
    },

    async getByEmail(query: GetPartiesByEmailQuery): Promise<GetPartiesByEmailResult> {
      // TODO: Implement email search when repository supports it
      const parties = await deps.parties.getByEmail({
        tenantId: query.tenantId,
        envelopeId: query.envelopeId,
        email: query.email,
      });

      return { parties };
    },
  };
};



