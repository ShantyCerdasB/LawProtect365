/**
 * @file GetGlobalPartyApp.service.ts
 * @summary Application service for getting Global Party (contact) by ID
 * @description Application service for retrieving a specific Global Party from the address book.
 * Orchestrates use cases and handles application-level concerns.
 */

import type { GlobalParty } from "@/domain/entities/GlobalParty";
import type { GlobalPartiesQueriesPort } from "@/app/ports/global-parties";
import { executeGetGlobalParty } from "@/use-cases/global-parties/GetGlobalPartyUseCase";

/**
 * @description Dependencies for the GetGlobalPartyApp service.
 */
export interface GetGlobalPartyAppDependencies {
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * @description Input for the GetGlobalPartyApp service.
 */
export interface GetGlobalPartyAppInput {
  tenantId: string;
  globalPartyId: string;
}

/**
 * @description Result of the GetGlobalPartyApp service.
 */
export interface GetGlobalPartyAppResult {
  globalParty: GlobalParty;
}

/**
 * @description Gets a Global Party (contact) by ID from the address book.
 * 
 * @param input - The input data for getting a Global Party
 * @param deps - The dependencies for the service
 * @returns Promise resolving to the Global Party
 */
export const getGlobalPartyApp = async (
  input: GetGlobalPartyAppInput,
  deps: GetGlobalPartyAppDependencies
): Promise<GetGlobalPartyAppResult> => {
  const result = await executeGetGlobalParty(input, deps);
  return result;
};



