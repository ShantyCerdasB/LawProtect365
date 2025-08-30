/**
 * @file GetGlobalPartyUseCase.ts
 * @summary Use case for getting a single global party from the address book
 * @description Handles the business logic for retrieving a global party including validation,
 * domain rules enforcement, and coordination with the global parties queries port.
 */

import type { GetGlobalPartyInput, GlobalPartiesQueriesPort } from "../../app/ports/parties/GlobalPartiesQueriesPort";
import { badRequest, partyNotFound } from "../../shared/errors";
import { validateTenantAndPartyIds } from "../shared/GlobalPartyValidations";

/**
 * Input parameters for the GetGlobalParty use case
 * @interface GetGlobalPartyUseCaseInput
 * @description Data required to retrieve a global party
 */
export interface GetGlobalPartyUseCaseInput {
  /** The tenant ID that owns the party */
  tenantId: string;
  /** The unique identifier of the party to retrieve */
  partyId: string;
}

/**
 * Result of the GetGlobalParty use case
 * @interface GetGlobalPartyUseCaseResult
 * @description Contains the party information
 */
export interface GetGlobalPartyUseCaseResult {
  /** The complete party data */
  party: {
    /** The unique identifier of the party */
    id: string;
    /** The tenant ID that owns the party */
    tenantId: string;
    /** The display name of the party */
    name: string;
    /** The email address of the party */
    email: string;
    /** Optional phone number of the party */
    phone?: string;
    /** The role assigned to the party */
    role: string;
    /** The source of the party */
    source: string;
    /** The status of the party */
    status: string;
    /** Optional metadata associated with the party */
    metadata?: Record<string, unknown>;
    /** Notification preferences for the party */
    notificationPreferences: {
      /** Whether to send email notifications */
      email: boolean;
      /** Whether to send SMS notifications */
      sms: boolean;
    };
    /** ISO timestamp when the party was created */
    createdAt: string;
    /** ISO timestamp when the party was last updated */
    updatedAt: string;
  };
}

/**
 * Dependencies required by the GetGlobalParty use case
 * @interface GetGlobalPartyUseCaseDeps
 * @description External dependencies needed for the use case execution
 */
export interface GetGlobalPartyUseCaseDeps {
  /** Port for global party query operations */
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * Use case for getting a single global party
 * @class GetGlobalPartyUseCase
 * @description Handles the business logic for retrieving a global party from the address book
 */
export class GetGlobalPartyUseCase {
  constructor(private readonly deps: GetGlobalPartyUseCaseDeps) {}

  /**
   * Execute the get global party use case
   * @param input - The input data for retrieving a global party
   * @returns Promise resolving to the party data or null if not found
   * @throws {BadRequestError} When input validation fails
   * @throws {NotFoundError} When party is not found
   */
  async execute(input: GetGlobalPartyUseCaseInput): Promise<GetGlobalPartyUseCaseResult | null> {
    // Validate input parameters
    this.validateInput(input);

    // Check if party exists and belongs to tenant
    const party = await this.deps.globalPartiesQueries.getById({
      tenantId: input.tenantId as any,
      partyId: input.partyId as any,
    });

    if (!party) {
      return null;
    }

    if (party.tenantId !== input.tenantId) {
      throw badRequest("Party does not belong to this tenant");
    }

    // Transform result to use case format
    return {
      party: {
        id: party.id,
        tenantId: party.tenantId,
        name: party.name,
        email: party.email,
        phone: party.phone,
        role: party.role,
        source: party.source,
        status: party.status,
        metadata: party.metadata,
        notificationPreferences: party.notificationPreferences,
        createdAt: party.createdAt,
        updatedAt: party.updatedAt,
      },
    };
  }

  /**
   * Validate the input parameters
   * @param input - The input data to validate
   * @throws {BadRequestError} When validation fails
   */
  private validateInput(input: GetGlobalPartyUseCaseInput): void {
    validateTenantAndPartyIds(input.tenantId, input.partyId);
  }
}
