/**
 * @file ListGlobalPartiesApp.service.ts
 * @summary Application service for listing Global Parties (contacts)
 * @description Application service for listing and searching Global Parties in the address book.
 * Orchestrates use cases and handles application-level concerns.
 */

import type { GlobalParty } from "@/domain/entities/GlobalParty";
import type { GlobalPartiesQueriesPort } from "@/app/ports/global-parties";
import { executeListGlobalParties } from "@/use-cases/global-parties/ListGlobalPartiesUseCase";

/**
 * @description Dependencies for the ListGlobalPartiesApp service.
 */
export interface ListGlobalPartiesAppDependencies {
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * @description Input for the ListGlobalPartiesApp service.
 */
export interface ListGlobalPartiesAppInput {
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
 * @description Result of the ListGlobalPartiesApp service.
 */
export interface ListGlobalPartiesAppResult {
  globalParties: GlobalParty[];
  nextCursor?: string;
  total: number;
}

/**
 * @description Lists and searches Global Parties (contacts) in the address book.
 * 
 * @param input - The input data for listing Global Parties
 * @param deps - The dependencies for the service
 * @returns Promise resolving to the list of Global Parties
 */
export const listGlobalPartiesApp = async (
  input: ListGlobalPartiesAppInput,
  deps: ListGlobalPartiesAppDependencies
): Promise<ListGlobalPartiesAppResult> => {
  const result = await executeListGlobalParties(input, deps);
  return result;
};
