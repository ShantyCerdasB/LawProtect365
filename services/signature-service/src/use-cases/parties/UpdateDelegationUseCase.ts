/**
 * @file UpdateDelegationUseCase.ts
 * @summary Use case for updating a delegation between global parties
 * @description Handles the business logic for updating delegation records including validation,
 * domain rules enforcement, and coordination with the global parties commands port.
 */

import type { UpdateDelegationInput, UpdateDelegationResult, GlobalPartiesCommandsPort } from "../../app/ports/parties/GlobalPartiesCommandsPort";
import type { GlobalPartiesQueriesPort } from "../../app/ports/parties/GlobalPartiesQueriesPort";
import { badRequest, partyNotFound } from "../../shared/errors";
import { validateTenantAndPartyIds } from "../shared/GlobalPartyValidations";

/**
 * Input parameters for the UpdateDelegation use case
 * @interface UpdateDelegationUseCaseInput
 * @description Data required to update a delegation
 */
export interface UpdateDelegationUseCaseInput {
  /** The tenant ID that owns the delegation */
  tenantId: string;
  /** The unique identifier of the delegation to update */
  delegationId: string;
  /** The fields to update */
  updates: {
    /** The reason for the delegation */
    reason?: string;
    /** The type of delegation */
    type?: string;
    /** Optional expiration date for the delegation */
    expiresAt?: string;
    /** Optional metadata associated with the delegation */
    metadata?: Record<string, unknown>;
  };
}

/**
 * Result of the UpdateDelegation use case
 * @interface UpdateDelegationUseCaseResult
 * @description Contains the updated delegation information
 */
export interface UpdateDelegationUseCaseResult {
  /** The complete updated delegation data */
  delegation: {
    /** The unique identifier of the delegation */
    id: string;
    /** The tenant ID that owns the delegation */
    tenantId: string;
    /** The ID of the original party being delegated */
    originalPartyId: string;
    /** The ID of the delegate party */
    delegatePartyId: string;
    /** The reason for the delegation */
    reason: string;
    /** The type of delegation */
    type: string;

    /** Optional expiration date for the delegation */
    expiresAt?: string;
    /** Optional metadata associated with the delegation */
    metadata?: Record<string, unknown>;
    /** ISO timestamp when the delegation was created */
    createdAt: string;

  };
}

/**
 * Dependencies required by the UpdateDelegation use case
 * @interface UpdateDelegationUseCaseDeps
 * @description External dependencies needed for the use case execution
 */
export interface UpdateDelegationUseCaseDeps {
  /** Port for global party command operations */
  globalPartiesCommands: GlobalPartiesCommandsPort;
  /** Port for global party query operations */
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * Use case for updating a delegation
 * @class UpdateDelegationUseCase
 * @description Handles the business logic for updating delegation records
 */
export class UpdateDelegationUseCase {
  constructor(private readonly deps: UpdateDelegationUseCaseDeps) {}

  /**
   * Execute the update delegation use case
   * @param input - The input data for updating a delegation
   * @returns Promise resolving to the update result
   * @throws {BadRequestError} When input validation fails
   * @throws {NotFoundError} When delegation is not found
   */
  async execute(input: UpdateDelegationUseCaseInput): Promise<UpdateDelegationUseCaseResult> {
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
    const commandInput: UpdateDelegationInput = {
      tenantId: input.tenantId as any,
      delegationId: input.delegationId as any,
      updates: {
        ...input.updates,
        metadata: input.updates.metadata as any,
      },
    };

    // Execute command
    const result = await this.deps.globalPartiesCommands.updateDelegation(commandInput);

    // Transform result to use case format
    return {
      delegation: {
        id: result.delegation.id,
        tenantId: result.delegation.tenantId,
        originalPartyId: result.delegation.originalPartyId,
        delegatePartyId: result.delegation.delegatePartyId,
        reason: result.delegation.reason,
        type: result.delegation.type,
        expiresAt: result.delegation.expiresAt,
        metadata: result.delegation.metadata,
        createdAt: result.delegation.createdAt,
      },
    };
  }

  /**
   * Validate the input parameters
   * @param input - The input data to validate
   * @throws {BadRequestError} When validation fails
   */
  private validateInput(input: UpdateDelegationUseCaseInput): void {
    validateTenantAndPartyIds(input.tenantId, input.delegationId);

    if (input.updates.reason !== undefined && !input.updates.reason?.trim()) {
      throw badRequest("Delegation reason cannot be empty if provided");
    }

    if (input.updates.type !== undefined && !input.updates.type?.trim()) {
      throw badRequest("Delegation type cannot be empty if provided");
    }

    if (input.updates.expiresAt !== undefined && !input.updates.expiresAt?.trim()) {
      throw badRequest("Expiration date cannot be empty if provided");
    }
  }
}
