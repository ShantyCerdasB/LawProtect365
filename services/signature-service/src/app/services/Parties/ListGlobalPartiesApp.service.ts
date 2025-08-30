/**
 * @file ListGlobalPartiesApp.service.ts
 * @summary App service for listing global parties
 * @description Orchestrates the listing of global parties by delegating to the use case
 */

import type { ListGlobalPartiesUseCase } from "../../../use-cases/parties/ListGlobalPartiesUseCase";

/**
 * Input parameters for the ListGlobalParties app service
 * @interface ListGlobalPartiesAppInput
 * @description Data required to list global parties
 */
export interface ListGlobalPartiesAppInput {
  /** The tenant ID to list parties for */
  tenantId: string;
  /** Maximum number of parties to return */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
  /** Optional search term to filter parties */
  search?: string;
  /** Optional role filter */
  role?: string;
  /** Optional source filter */
  source?: string;
}

/**
 * Result of the ListGlobalParties app service
 * @interface ListGlobalPartiesAppResult
 * @description Contains the list of parties and pagination information
 */
export interface ListGlobalPartiesAppResult {
  /** Array of party data */
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
  /** Pagination information */
  pagination: {
    /** Cursor for the next page */
    nextCursor?: string;
    /** Total number of parties */
    total: number;
  };
}

/**
 * Dependencies required by the ListGlobalParties app service
 * @interface ListGlobalPartiesAppDependencies
 * @description External dependencies needed for the app service execution
 */
export interface ListGlobalPartiesAppDependencies {
  /** Use case for listing global parties */
  listGlobalPartiesUseCase: ListGlobalPartiesUseCase;
}

/**
 * Lists global parties using the provided use case
 * @param input - The input data for listing global parties
 * @param deps - Dependencies required for the operation
 * @returns Promise resolving to the list result
 */
export const listGlobalPartiesApp = async (
  input: ListGlobalPartiesAppInput,
  deps: ListGlobalPartiesAppDependencies
): Promise<ListGlobalPartiesAppResult> => {
  const result = await deps.listGlobalPartiesUseCase.execute({
    tenantId: input.tenantId,
    limit: input.limit,
    cursor: input.cursor,
    search: input.search,
    role: input.role,
    source: input.source,
  });

  return {
    parties: result.parties,
    pagination: result.pagination,
  };
};
