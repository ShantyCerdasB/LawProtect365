/**
 * @file DeleteDelegationUseCase.ts
 * @summary Use case for deleting a delegation between global parties
 * @description Handles the business logic for deleting delegation records including validation,
 * domain rules enforcement, and coordination with the global parties commands port.
 */

import type { DeleteDelegationInput, GlobalPartiesCommandsPort } from "../../app/ports/parties/GlobalPartiesCommandsPort";
import type { GlobalPartiesQueriesPort } from "../../app/ports/parties/GlobalPartiesQueriesPort";
import { badRequest, partyNotFound } from "../../shared/errors";
import { validateTenantAndPartyIds } from "../shared/GlobalPartyValidations";

/**
 * Input parameters for the DeleteDelegation use case
 * @interface DeleteDelegationUseCaseInput
 * @description Data required to delete a delegation
 */
export interface DeleteDelegationUseCaseInput {
  /** The tenant ID that owns the delegation */
  tenantId: string;
  /** The unique identifier of the delegation to delete */
  delegationId: string;
}

/**
 * Result of the DeleteDelegation use case
 * @interface DeleteDelegationUseCaseResult
 * @description Contains the deletion confirmation
 */
export interface DeleteDelegationUseCaseResult {
  /** Confirmation that the delegation was deleted */
  deleted: boolean;
  /** The ID of the deleted delegation */
  delegationId: string;
}

/**
 * Dependencies required by the DeleteDelegation use case
 * @interface DeleteDelegationUseCaseDeps
 * @description External dependencies needed for the use case execution
 */
export interface DeleteDelegationUseCaseDeps {
  /** Port for global party command operations */
  globalPartiesCommands: GlobalPartiesCommandsPort;
  /** Port for global party query operations */
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * Use case for deleting a delegation
 * @class DeleteDelegationUseCase
 * @description Handles the business logic for deleting delegation records
 */
export class DeleteDelegationUseCase {
  constructor(private readonly deps: DeleteDelegationUseCaseDeps) {}

  /**
   * Execute the delete delegation use case
   * @param input - The input data for deleting a delegation
   * @returns Promise resolving to the deletion result
   * @throws {BadRequestError} When input validation fails
   * @throws {NotFoundError} When delegation is not found
   */
  async execute(input: DeleteDelegationUseCaseInput): Promise<DeleteDelegationUseCaseResult> {
    // Validate input parameters
    this.validateInput(input);

    // Check if delegation exists and belongs to tenant
    const existingDelegation = await this.deps.globalPartiesQueries.getDelegation({
      tenantId: input.tenantId as any,
      delegationId: input.delegationId as any,
    });

    if (!existingDelegation) {
      throw partyNotFound();
    }

    if (existingDelegation.tenantId !== input.tenantId) {
      throw badRequest("Delegation does not belong to this tenant");
    }

    // Prepare command input
    const commandInput: DeleteDelegationInput = {
      tenantId: input.tenantId as any,
      delegationId: input.delegationId as any,
    };

    // Execute command
    await this.deps.globalPartiesCommands.deleteDelegation(commandInput);

    // Return success result
    return {
      deleted: true,
      delegationId: input.delegationId,
    };
  }

  /**
   * Validate the input parameters
   * @param input - The input data to validate
   * @throws {BadRequestError} When validation fails
   */
  private validateInput(input: DeleteDelegationUseCaseInput): void {
    validateTenantAndPartyIds(input.tenantId, input.delegationId);
  }
}
