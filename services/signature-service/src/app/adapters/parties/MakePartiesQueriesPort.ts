/**
 * @file MakePartiesQueriesPort.ts
 * @summary Adapter factory for Parties Queries Port
 * @description Creates PartiesQueriesPort implementation using DynamoDB repository.
 * Handles list, get by ID, and search by email operations for envelope-scoped Parties.
 */

import type { PartiesQueriesPort } from "../../ports/parties";
import type { Repository } from "@lawprotect/shared-ts";
import type { Party } from "../../../domain/entities/Party";
import type { PartyKey } from "../../../domain/types/infrastructure/dynamodb";
import { 
  ListPartiesAppInput,
  ListPartiesAppResult,
  SearchPartiesByEmailAppInput,
  SearchPartiesByEmailAppResult,
  GetPartyAppInput,
  GetPartyAppResult
} from "../../../domain/types/parties";


/**
 * @description Creates PartiesQueriesPort implementation.
 * 
 * @param partiesRepo - Party repository implementation
 * @param ids - ID generation service
 * @returns PartiesQueriesPort implementation
 */
export function makePartiesQueriesPort(
  partiesRepo: Repository<Party, PartyKey, undefined>,

): PartiesQueriesPort {
  return {
    async list(query: ListPartiesAppInput): Promise<ListPartiesAppResult> {
      // Use the existing repository method
      const result = await (partiesRepo as any).listByEnvelope({
        tenantId: query.tenantId,
        envelopeId: query.envelopeId,
        role: query.role,
        status: query.status,
        limit: query.limit || 20,
        cursor: query.cursor,
      });

      return {
        parties: result.items,
        nextCursor: result.nextCursor,
        total: result.total,
      };
    },

    async getById(query: GetPartyAppInput): Promise<GetPartyAppResult> {
      const party = await partiesRepo.getById({ 
        envelopeId: query.envelopeId, 
        partyId: query.partyId 
      });
      
      // Filter by tenant for security
      if (party && party.tenantId !== query.tenantId) {
        return { party: null };
      }

      return { 
        party: party
      };
    },

    async searchByEmail(query: SearchPartiesByEmailAppInput): Promise<SearchPartiesByEmailAppResult> {
      // Use the existing repository method
      const result = await (partiesRepo as any).getByEmail({
        tenantId: query.tenantId,
        envelopeId: query.envelopeId,
        email: query.email,
      });

      return { 
        parties: result.items
      };
    },
  };
}






