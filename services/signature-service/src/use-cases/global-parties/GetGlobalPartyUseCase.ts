/**
 * @file GetGlobalPartyUseCase.ts
 * @summary Use case for getting a Global Party (contact) by ID
 * @description Use case for retrieving a specific Global Party from the address book.
 * Handles validation and error handling.
 */

import type { GlobalParty } from "@/domain/entities/GlobalParty";
import type { GlobalPartiesQueriesPort } from "@/app/ports/global-parties";
import type { GetGlobalPartyQuery, GetGlobalPartyResult } from "@/app/ports/global-parties";
import { notFound } from "@/shared/errors";

/**
 * @description Dependencies for the GetGlobalParty use case.
 */
export interface GetGlobalPartyUseCaseDeps {
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * @description Input for the GetGlobalParty use case.
 */
export interface GetGlobalPartyUseCaseInput {
  tenantId: string;
  globalPartyId: string;
}

/**
 * @description Result of the GetGlobalParty use case.
 */
export interface GetGlobalPartyUseCaseResult {
  globalParty: GlobalParty;
}

/**
 * @description Gets a Global Party (contact) by ID from the address book.
 * 
 * @param input - The input data for getting a Global Party
 * @param deps - The dependencies for the use case
 * @returns Promise resolving to the Global Party
 * @throws {NotFoundError} When the Global Party doesn't exist
 */
export const executeGetGlobalParty = async (
  input: GetGlobalPartyUseCaseInput,
  deps: GetGlobalPartyUseCaseDeps
): Promise<GetGlobalPartyUseCaseResult> => {
  // 1. Validate input
  if (!input.globalPartyId) {
    throw notFound("Global Party ID is required");
  }

  // 2. Prepare query
  const query: GetGlobalPartyQuery = {
    tenantId: input.tenantId,
    globalPartyId: input.globalPartyId,
  };

  // 3. Execute query
  const result: GetGlobalPartyResult = await deps.globalPartiesQueries.getById(query);

  // 4. Check if Global Party exists
  if (!result.globalParty) {
    throw notFound(`Global Party with ID ${input.globalPartyId} not found`);
  }

  return {
    globalParty: result.globalParty,
  };
};

