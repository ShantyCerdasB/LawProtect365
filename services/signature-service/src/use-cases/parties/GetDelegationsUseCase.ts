/**
 * @file GetDelegationsUseCase.ts
 * @summary Use case for getting delegations for a global party
 * @description Handles the business logic for retrieving delegation records for a specific party.
 */

import type { GlobalPartiesQueriesPort } from "../../app/ports/parties/GlobalPartiesQueriesPort";
import { validateTenantAndPartyIds } from "../shared/GlobalPartyValidations";

/**
 * Input parameters for the GetDelegations use case
 * @interface GetDelegationsUseCaseInput
 * @description Data required to get delegations for a party
 */
export interface GetDelegationsUseCaseInput {
  /** The tenant ID that owns the party */
  tenantId: string;
  /** The unique identifier of the party to get delegations for */
  partyId: string;
}

/**
 * Result of the GetDelegations use case
 * @interface GetDelegationsUseCaseResult
 * @description Contains the list of delegations
 */
export interface GetDelegationsUseCaseResult {
  /** Array of delegation records */
  delegations: Array<{
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
  }>;
}

/**
 * Dependencies required by the GetDelegations use case
 * @interface GetDelegationsUseCaseDeps
 * @description External dependencies needed for the use case execution
 */
export interface GetDelegationsUseCaseDeps {
  /** Port for global party query operations */
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * Use case for getting delegations
 * @class GetDelegationsUseCase
 * @description Handles the business logic for retrieving delegation records
 */
export class GetDelegationsUseCase {
  constructor(private readonly deps: GetDelegationsUseCaseDeps) {}

  /**
   * Execute the get delegations use case
   * @param input - The input data for getting delegations
   * @returns Promise resolving to the delegations list
   * @throws {BadRequestError} When input validation fails
   */
  async execute(input: GetDelegationsUseCaseInput): Promise<GetDelegationsUseCaseResult> {
    // Validate input parameters
    validateTenantAndPartyIds(input.tenantId, input.partyId);

    // Execute query
    const result = await this.deps.globalPartiesQueries.getDelegations({
      tenantId: input.tenantId as any,
      partyId: input.partyId as any,
    });

    // Transform result to use case format
    return {
      delegations: result.delegations.map((delegation) => ({
        id: delegation.id,
        tenantId: delegation.tenantId,
        originalPartyId: delegation.originalPartyId,
        delegatePartyId: delegation.delegatePartyId,
        reason: delegation.reason,
        type: delegation.type,

        expiresAt: delegation.expiresAt,
        metadata: delegation.metadata,
        createdAt: delegation.createdAt,
      })),
    };
  }
}
