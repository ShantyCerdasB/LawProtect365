/**
 * @file ListPartiesUseCase.ts
 * @summary Use case for listing Parties in an envelope
 * @description Use case for listing Parties within an envelope.
 * Handles filtering and pagination.
 */

import type { Party } from "@/domain/entities/Party";
import type { PartiesQueriesPort } from "@/app/ports/parties";
import type { ListPartiesQuery, ListPartiesResult } from "@/app/ports/parties";

/**
 * @description Dependencies for the ListParties use case.
 */
export interface ListPartiesUseCaseDeps {
  partiesQueries: PartiesQueriesPort;
}

/**
 * @description Input for the ListParties use case.
 */
export interface ListPartiesUseCaseInput {
  tenantId: string;
  envelopeId: string;
  role?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}

/**
 * @description Result of the ListParties use case.
 */
export interface ListPartiesUseCaseResult {
  parties: Party[];
  nextCursor?: string;
  total: number;
}

/**
 * @description Lists Parties within an envelope.
 * 
 * @param input - The input data for listing Parties
 * @param deps - The dependencies for the use case
 * @returns Promise resolving to the list of Parties
 */
export const executeListParties = async (
  input: ListPartiesUseCaseInput,
  deps: ListPartiesUseCaseDeps
): Promise<ListPartiesUseCaseResult> => {
  // 1. Prepare query
  const query: ListPartiesQuery = {
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    role: input.role as any,
    status: input.status as any,
    limit: input.limit || 20,
    cursor: input.cursor,
  };

  // 2. Execute query
  const result: ListPartiesResult = await deps.partiesQueries.list(query);

  return {
    parties: result.parties,
    nextCursor: result.nextCursor,
    total: result.total,
  };
};

