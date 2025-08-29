/**
 * @file ListEnvelopesApp.service.ts
 * @summary Application service for listing envelopes with pagination
 * @description Orchestrates envelope listing operations, delegates to EnvelopesQueriesPort,
 * and handles pagination logic. Uses branded types for type safety.
 */

import type { TenantId } from "@/app/ports/shared";
import type { EnvelopesQueriesPort } from "@/app/ports/envelopes/EnvelopesQueriesPort";

/**
 * Input parameters for listing envelopes
 */
export interface ListEnvelopesAppInput {
  tenantId: TenantId;
  limit?: number;
  cursor?: string;
}

/**
 * Output result for listing envelopes
 */
export interface ListEnvelopesAppResult {
  items: any[];
  nextCursor?: string;
}

/**
 * Dependencies required by the ListEnvelopes app service
 */
export interface ListEnvelopesAppDependencies {
  envelopesQueries: EnvelopesQueriesPort;
}

/**
 * Lists envelopes for a tenant with forward cursor pagination
 * @param input - The input parameters containing tenant ID and pagination options
 * @param deps - The dependencies containing the envelopes queries port
 * @returns Promise resolving to paginated envelope list
 * @throws {AppError} When query fails or validation errors occur
 */
export const listEnvelopesApp = async (
  input: ListEnvelopesAppInput,
  deps: ListEnvelopesAppDependencies
): Promise<ListEnvelopesAppResult> => {
  const page = await deps.envelopesQueries.listByTenant({
    tenantId: input.tenantId,
    limit: input.limit,
    cursor: input.cursor,
  });

  return {
    items: page.items,
    nextCursor: page.nextCursor,
  };
};
