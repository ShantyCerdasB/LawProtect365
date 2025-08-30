/**
 * @file ListGlobalPartiesUseCase.ts
 * @summary Use case for listing Global Parties (contacts)
 * @description Use case for listing and searching Global Parties in the address book.
 * Handles filtering, pagination, and search functionality.
 */

import type { GlobalParty } from "@/domain/entities/GlobalParty";
import type { GlobalPartiesQueriesPort } from "@/app/ports/global-parties";
import type { ListGlobalPartiesQuery, ListGlobalPartiesResult } from "@/app/ports/global-parties";

/**
 * @description Dependencies for the ListGlobalParties use case.
 */
export interface ListGlobalPartiesUseCaseDeps {
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * @description Input for the ListGlobalParties use case.
 */
export interface ListGlobalPartiesUseCaseInput {
  tenantId: string;
  search?: string;
  tags?: string[];
  role?: string;
  source?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}

/**
 * @description Result of the ListGlobalParties use case.
 */
export interface ListGlobalPartiesUseCaseResult {
  globalParties: GlobalParty[];
  nextCursor?: string;
  total: number;
}

/**
 * @description Lists and searches Global Parties (contacts) in the address book.
 * 
 * @param input - The input data for listing Global Parties
 * @param deps - The dependencies for the use case
 * @returns Promise resolving to the list of Global Parties
 */
export const executeListGlobalParties = async (
  input: ListGlobalPartiesUseCaseInput,
  deps: ListGlobalPartiesUseCaseDeps
): Promise<ListGlobalPartiesUseCaseResult> => {
  // 1. Prepare query
  const query: ListGlobalPartiesQuery = {
    tenantId: input.tenantId,
    search: input.search?.trim(),
    tags: input.tags,
    role: input.role as any,
    source: input.source as any,
    status: input.status as any,
    limit: input.limit || 20,
    cursor: input.cursor,
  };

  // 2. Execute query
  const result: ListGlobalPartiesResult = await deps.globalPartiesQueries.list(query);

  return {
    globalParties: result.globalParties,
    nextCursor: result.nextCursor,
    total: result.total,
  };
};

