/**
 * @file DeleteGlobalPartyApp.service.ts
 * @summary App service for deleting global parties
 * @description Orchestrates the deletion of global parties by delegating to the use case
 */

import type { DeleteGlobalPartyUseCase } from "../../../use-cases/parties/DeleteGlobalPartyUseCase";

/**
 * Input parameters for the DeleteGlobalParty app service
 * @interface DeleteGlobalPartyAppInput
 * @description Data required to delete a global party
 */
export interface DeleteGlobalPartyAppInput {
  /** The tenant ID that owns the party */
  tenantId: string;
  /** The unique identifier of the party to delete */
  partyId: string;
}

/**
 * Result of the DeleteGlobalParty app service
 * @interface DeleteGlobalPartyAppResult
 * @description Contains the deletion confirmation
 */
export interface DeleteGlobalPartyAppResult {
  /** Confirmation that the party was deleted */
  deleted: boolean;
  /** The ID of the deleted party */
  partyId: string;
  /** ISO timestamp when the party was deleted */
  deletedAt: string;
}

/**
 * Dependencies required by the DeleteGlobalParty app service
 * @interface DeleteGlobalPartyAppDependencies
 * @description External dependencies needed for the app service execution
 */
export interface DeleteGlobalPartyAppDependencies {
  /** Use case for deleting global parties */
  deleteGlobalPartyUseCase: DeleteGlobalPartyUseCase;
}

/**
 * Deletes a global party using the provided use case
 * @param input - The input data for deleting a global party
 * @param deps - Dependencies required for the operation
 * @returns Promise resolving to the deletion result
 */
export const deleteGlobalPartyApp = async (
  input: DeleteGlobalPartyAppInput,
  deps: DeleteGlobalPartyAppDependencies
): Promise<DeleteGlobalPartyAppResult> => {
  const result = await deps.deleteGlobalPartyUseCase.execute({
    tenantId: input.tenantId,
    partyId: input.partyId,
  });

  return {
    deleted: result.deleted,
    partyId: result.partyId,
    deletedAt: result.deletedAt,
  };
};
