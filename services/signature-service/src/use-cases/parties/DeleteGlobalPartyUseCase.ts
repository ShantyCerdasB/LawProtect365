/**
 * @file DeleteGlobalPartyUseCase.ts
 * @summary Use case for deleting a global party from the address book
 * @description Handles the business logic for deleting a global party including validation,
 * domain rules enforcement, and coordination with the global parties commands port.
 */

import type { DeleteGlobalPartyInput, GlobalPartiesCommandsPort } from "../../app/ports/parties/GlobalPartiesCommandsPort";
import type { GlobalPartiesQueriesPort } from "../../app/ports/parties/GlobalPartiesQueriesPort";
import { assertPartyCanBeDeleted } from "../../domain/rules/GlobalParties.rules";
import { badRequest, partyNotFound } from "../../errors";
import { validateTenantAndPartyIds } from "../shared/GlobalPartyValidations";

/**
 * Input parameters for the DeleteGlobalParty use case
 * @interface DeleteGlobalPartyUseCaseInput
 * @description Data required to delete a global party
 */
export interface DeleteGlobalPartyUseCaseInput {
  /** The tenant ID that owns the party */
  tenantId: string;
  /** The unique identifier of the party to delete */
  partyId: string;
}

/**
 * Result of the DeleteGlobalParty use case
 * @interface DeleteGlobalPartyUseCaseResult
 * @description Contains the deletion confirmation
 */
export interface DeleteGlobalPartyUseCaseResult {
  /** Confirmation that the party was deleted */
  deleted: boolean;
  /** The ID of the deleted party */
  partyId: string;
}

/**
 * Dependencies required by the DeleteGlobalParty use case
 * @interface DeleteGlobalPartyUseCaseDeps
 * @description External dependencies needed for the use case execution
 */
export interface DeleteGlobalPartyUseCaseDeps {
  /** Port for global party command operations */
  globalPartiesCommands: GlobalPartiesCommandsPort;
  /** Port for global party query operations */
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * Use case for deleting a global party
 * @class DeleteGlobalPartyUseCase
 * @description Handles the business logic for deleting a global party from the address book
 */
export class DeleteGlobalPartyUseCase {
  constructor(private readonly deps: DeleteGlobalPartyUseCaseDeps) {}

  /**
   * Execute the delete global party use case
   * @param input - The input data for deleting a global party
   * @returns Promise resolving to the deletion result
   * @throws {BadRequestError} When input validation fails
   * @throws {NotFoundError} When party is not found
   * @throws {ConflictError} When party cannot be deleted
   */
  async execute(input: DeleteGlobalPartyUseCaseInput): Promise<DeleteGlobalPartyUseCaseResult> {
    // Validate input parameters
    this.validateInput(input);

    // Check if party exists and belongs to tenant
    const existingParty = await this.deps.globalPartiesQueries.getById({
      tenantId: input.tenantId as any,
      partyId: input.partyId as any,
    });

    if (!existingParty) {
      throw partyNotFound();
    }

    if (existingParty.tenantId !== input.tenantId) {
      throw badRequest("Party does not belong to this tenant");
    }

    // Check if party can be deleted (no active delegations, etc.)
    await assertPartyCanBeDeleted(existingParty, this.deps.globalPartiesQueries as any);

    // Prepare command input
    const commandInput: DeleteGlobalPartyInput = {
      tenantId: input.tenantId as any,
      partyId: input.partyId as any,
    };

    // Execute command
    await this.deps.globalPartiesCommands.delete(commandInput);

    // Return success result
    return {
      deleted: true,
      partyId: input.partyId,
    };
  }

  /**
   * Validate the input parameters
   * @param input - The input data to validate
   * @throws {BadRequestError} When validation fails
   */
  private validateInput(input: DeleteGlobalPartyUseCaseInput): void {
    validateTenantAndPartyIds(input.tenantId, input.partyId);
  }
}
