/**
 * @file ListPartiesApp.service.ts
 * @summary Application service for listing Parties in envelopes
 * @description Application service for listing Parties within envelopes.
 * Orchestrates use cases and handles application-level concerns.
 */

import type { Party } from "@/domain/entities/Party";
import type { PartiesQueriesPort } from "@/app/ports/parties";
import { executeListParties } from "@/use-cases/parties/ListPartiesUseCase";

/**
 * @description Dependencies for the ListPartiesApp service.
 */
export interface ListPartiesAppDependencies {
  partiesQueries: PartiesQueriesPort;
}

/**
 * @description Input for the ListPartiesApp service.
 */
export interface ListPartiesAppInput {
  tenantId: string;
  envelopeId: string;
  role?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}

/**
 * @description Result of the ListPartiesApp service.
 */
export interface ListPartiesAppResult {
  parties: Party[];
  nextCursor?: string;
  total: number;
}

/**
 * @description Lists Parties within an envelope.
 * 
 * @param input - The input data for listing Parties
 * @param deps - The dependencies for the service
 * @returns Promise resolving to the list of Parties
 */
export const listPartiesApp = async (
  input: ListPartiesAppInput,
  deps: ListPartiesAppDependencies
): Promise<ListPartiesAppResult> => {
  const result = await executeListParties(input, deps);
  return result;
};



