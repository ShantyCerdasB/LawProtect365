/**
 * @file ListGlobalPartiesUseCase.ts
 * @summary Use case for listing global parties from the address book
 * @description Handles the business logic for listing global parties including validation,
 * filtering, pagination, and coordination with the global parties queries port.
 */

import type { ListGlobalPartiesInput, ListGlobalPartiesResult, GlobalPartiesQueriesPort } from "../../app/ports/parties/GlobalPartiesQueriesPort";
import { badRequest } from "../../errors";
import { validateRequiredString } from "../shared/GlobalPartyValidations";

/**
 * Input parameters for the ListGlobalParties use case
 * @interface ListGlobalPartiesUseCaseInput
 * @description Data required to list global parties with filtering and pagination
 */
export interface ListGlobalPartiesUseCaseInput {
  /** The tenant ID to list parties for */
  tenantId: string;
  /** Maximum number of parties to return */
  limit?: number;
  /** Pagination cursor for the next page */
  cursor?: string;
  /** Optional search term to filter parties by name or email */
  search?: string;
  /** Optional role filter to return only parties with specific role */
  role?: string;
  /** Optional source filter to return only parties from specific source */
  source?: string;
}

/**
 * Result of the ListGlobalParties use case
 * @interface ListGlobalPartiesUseCaseResult
 * @description Contains the list of parties and pagination information
 */
export interface ListGlobalPartiesUseCaseResult {
  /** Array of global parties matching the criteria */
  parties: Array<{
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
  }>;
  /** Pagination metadata */
  pagination: {
    /** Cursor for the next page of results */
    nextCursor?: string;
    /** Total number of parties matching the criteria */
    total?: number;
    /** Number of parties returned in this page */
    count: number;
  };
}

/**
 * Dependencies required by the ListGlobalParties use case
 * @interface ListGlobalPartiesUseCaseDeps
 * @description External dependencies needed for the use case execution
 */
export interface ListGlobalPartiesUseCaseDeps {
  /** Port for global party query operations */
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * Use case for listing global parties
 * @class ListGlobalPartiesUseCase
 * @description Handles the business logic for listing global parties from the address book
 */
export class ListGlobalPartiesUseCase {
  constructor(private readonly deps: ListGlobalPartiesUseCaseDeps) {}

  /**
   * Execute the list global parties use case
   * @param input - The input data for listing global parties
   * @returns Promise resolving to the list result with parties and pagination
   * @throws {BadRequestError} When input validation fails
   */
  async execute(input: ListGlobalPartiesUseCaseInput): Promise<ListGlobalPartiesUseCaseResult> {
    // Validate input parameters
    this.validateInput(input);



    // Prepare query input
    const queryInput: ListGlobalPartiesInput = {
      tenantId: input.tenantId as any,
      limit: input.limit || 50,
      cursor: input.cursor,
      search: input.search,
      role: input.role as any,
      source: input.source as any,
    };

    // Execute query
    const result = await this.deps.globalPartiesQueries.list(queryInput);

    // Transform result to use case format
    const transformedParties = result.parties.map((party) => ({
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
    }));

    return {
      parties: transformedParties,
      pagination: {
        nextCursor: result.nextCursor,
        total: result.total,
        count: transformedParties.length,
      },
    };
  }

  /**
   * Validate the input parameters
   * @param input - The input data to validate
   * @throws {BadRequestError} When validation fails
   */
  private validateInput(input: ListGlobalPartiesUseCaseInput): void {
    validateRequiredString(input.tenantId, "Tenant ID");

    if (input.limit !== undefined) {
      if (typeof input.limit !== "number" || input.limit < 1 || input.limit > 100) {
        throw badRequest("Limit must be a number between 1 and 100");
      }
    }

    if (input.cursor !== undefined) {
      validateRequiredString(input.cursor, "Cursor");
    }

    if (input.search !== undefined) {
      validateRequiredString(input.search, "Search term");
    }
  }
}
