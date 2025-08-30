/**
 * @file MakeGlobalPartiesQueriesPort.ts
 * @summary Adapter factory for global parties queries port
 * @description Creates and configures the global parties queries port implementation
 * that handles read operations for global parties (address book).
 * 
 * This adapter delegates to use cases to maintain separation of concerns
 * and ensure business logic is properly applied.
 */

import type { GlobalPartiesQueriesPort } from "../../ports/parties/GlobalPartiesQueriesPort";
import type { GetGlobalPartyUseCase } from "../../../use-cases/parties/GetGlobalPartyUseCase";
import type { FindByEmailUseCase } from "../../../use-cases/parties/FindByEmailUseCase";
import type { GetDelegationsUseCase } from "../../../use-cases/parties/GetDelegationsUseCase";
import type { ListGlobalPartiesUseCase } from "../../../use-cases/parties/ListGlobalPartiesUseCase";

/**
 * Dependencies required to create the global parties queries port
 * @interface MakeGlobalPartiesQueriesPortDeps
 * @description External dependencies needed for the adapter creation
 */
export interface MakeGlobalPartiesQueriesPortDeps {
  /** Use case for getting a single global party */
  getGlobalPartyUseCase: GetGlobalPartyUseCase;
  /** Use case for finding parties by email */
  findByEmailUseCase: FindByEmailUseCase;
  /** Use case for getting delegations */
  getDelegationsUseCase: GetDelegationsUseCase;
  /** Use case for listing global parties */
  listGlobalPartiesUseCase: ListGlobalPartiesUseCase;
}

/**
 * Creates a global parties queries port implementation
 * @param deps - Dependencies required for creating the port
 * @returns Configured global parties queries port
 */
export function makeGlobalPartiesQueriesPort(
  deps: MakeGlobalPartiesQueriesPortDeps
): GlobalPartiesQueriesPort {
  return {
    async getById(input) {
      const result = await deps.getGlobalPartyUseCase.execute({
        tenantId: input.tenantId,
        partyId: input.partyId,
      });

      return result?.party as any;
    },

    async findByEmail(input) {
      const result = await deps.findByEmailUseCase.execute({
        tenantId: input.tenantId,
        email: input.email,
      });

      return result.party as any;
    },

    async list(input) {
      const result = await deps.listGlobalPartiesUseCase.execute({
        tenantId: input.tenantId,
        limit: input.limit,
        cursor: input.cursor,
        search: input.search,
        role: input.role,
        source: input.source,
      });

      return {
        parties: result.parties as any,
        nextCursor: result.pagination.nextCursor,
        total: result.pagination.total,
      };
    },

    async search(input) {
      throw new Error("SearchUseCase not implemented yet");
    },

    async getDelegations(input) {
      const result = await deps.getDelegationsUseCase.execute({
        tenantId: input.tenantId,
        partyId: input.partyId,
      });

      return {
        delegations: result.delegations as any,
      };
    },

    async getDelegation(input) {
      throw new Error("GetDelegationUseCase not implemented yet");
    },

    async hasActiveDelegations(input) {
      throw new Error("HasActiveDelegationsUseCase not implemented yet");
    },
  };
}
