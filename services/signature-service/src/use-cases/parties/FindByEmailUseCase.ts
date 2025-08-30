/**
 * @file FindByEmailUseCase.ts
 * @summary Use case for finding a global party by email
 * @description Handles the business logic for finding a global party by email address within a tenant.
 */

import type { GlobalPartiesQueriesPort } from "../../app/ports/parties/GlobalPartiesQueriesPort";
import { badRequest } from "../../shared/errors";
import { validateRequiredString } from "../shared/GlobalPartyValidations";

/**
 * Input parameters for the FindByEmail use case
 * @interface FindByEmailUseCaseInput
 * @description Data required to find a party by email
 */
export interface FindByEmailUseCaseInput {
  /** The tenant ID to search within */
  tenantId: string;
  /** The email address to search for */
  email: string;
}

/**
 * Result of the FindByEmail use case
 * @interface FindByEmailUseCaseResult
 * @description Contains the found party information or null
 */
export interface FindByEmailUseCaseResult {
  /** The found party data or null if not found */
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
  } | null;
}

/**
 * Dependencies required by the FindByEmail use case
 * @interface FindByEmailUseCaseDeps
 * @description External dependencies needed for the use case execution
 */
export interface FindByEmailUseCaseDeps {
  /** Port for global party query operations */
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * Use case for finding a party by email
 * @class FindByEmailUseCase
 * @description Handles the business logic for finding parties by email address
 */
export class FindByEmailUseCase {
  constructor(private readonly deps: FindByEmailUseCaseDeps) {}

  /**
   * Execute the find by email use case
   * @param input - The input data for finding a party by email
   * @returns Promise resolving to the found party or null
   * @throws {BadRequestError} When input validation fails
   */
  async execute(input: FindByEmailUseCaseInput): Promise<FindByEmailUseCaseResult> {
    // Validate input parameters
    this.validateInput(input);

    // Execute query
    const party = await this.deps.globalPartiesQueries.findByEmail({
      tenantId: input.tenantId as any,
      email: input.email,
    });

    // Transform result to use case format
    return {
      party: party ? {
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
      } : null,
    };
  }

  /**
   * Validate the input parameters
   * @param input - The input data to validate
   * @throws {BadRequestError} When validation fails
   */
  private validateInput(input: FindByEmailUseCaseInput): void {
    validateRequiredString(input.tenantId, "Tenant ID");
    validateRequiredString(input.email, "Email");
  }
}
