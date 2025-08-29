/**
 * @file ListPartiesApp.service.ts
 * @summary Application service for listing parties of an envelope
 * @description Orchestrates party listing operations, delegates to PartiesQueriesPort,
 * and handles pagination logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId } from "@/app/ports/shared";
import type { PartiesQueriesPort } from "@/app/ports/parties/PartiesQueriesPort";

/**
 * Input parameters for listing parties of an envelope
 */
export interface ListPartiesAppInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  limit?: number;
  cursor?: string;
}

/**
 * Output result for listing parties
 */
export interface ListPartiesAppResult {
  items: any[];
  nextCursor?: string;
}

/**
 * Dependencies required by the ListParties app service
 */
export interface ListPartiesAppDependencies {
  partiesQueries: PartiesQueriesPort;
}

/**
 * Lists parties of an envelope with forward cursor pagination
 * @param input - The input parameters containing envelope ID and pagination options
 * @param deps - The dependencies containing the parties queries port
 * @returns Promise resolving to paginated parties list
 * @throws {AppError} When query fails or validation errors occur
 */
export const listPartiesApp = async (
  input: ListPartiesAppInput,
  deps: ListPartiesAppDependencies
): Promise<ListPartiesAppResult> => {
  const page = await deps.partiesQueries.listByEnvelope({
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    limit: input.limit,
    cursor: input.cursor,
  });

  return {
    items: page.items,
    nextCursor: page.nextCursor,
  };
};
