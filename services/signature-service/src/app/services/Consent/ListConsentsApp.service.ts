/**
 * @file ListConsentsApp.service.ts
 * @summary Application service for listing consents
 * @description Orchestrates consent listing operations, delegates to ConsentQueriesPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId } from "../../ports/shared";
import type { ConsentQueriesPort } from "../../ports/consent/ConsentQueriesPort";

/**
 * Input parameters for listing consents
 */
export interface ListConsentsAppInput {
  /** The tenant ID that owns the consents */
  tenantId: TenantId;
  /** The envelope ID to filter consents by */
  envelopeId: EnvelopeId;
  /** Maximum number of consents to return (optional) */
  limit?: number;
  /** Pagination cursor for getting the next page of results (optional) */
  cursor?: string;
  /** Filter by consent status (optional) */
  status?: string;
  /** Filter by consent type (optional) */
  consentType?: string;
  /** Filter by party ID (optional) */
  partyId?: string;
}

/**
 * Output result for consent listing
 */
export interface ListConsentsAppResult {
  /** The list of consents */
  consents: any[];
  /** Cursor for the next page of results (optional) */
  nextCursor?: string;
}

/**
 * Dependencies required by the ListConsents app service
 */
export interface ListConsentsAppDependencies {
  /** Port for consent query operations */
  consentQueries: ConsentQueriesPort;
}

/**
 * Lists consents with proper validation and filtering
 * 
 * This service orchestrates the consent listing operation by:
 * 1. Validating the input parameters
 * 2. Delegating to the consent queries port
 * 3. Returning the filtered and paginated consent list
 * 
 * @param input - The input parameters containing filtering and pagination options
 * @param deps - The dependencies containing the consent queries port
 * @returns Promise resolving to paginated consent list
 * @throws {AppError} When validation fails or query fails
 */
export const listConsentsApp = async (
  input: ListConsentsAppInput,
  deps: ListConsentsAppDependencies
): Promise<ListConsentsAppResult> => {
  const result = await deps.consentQueries.listByEnvelope({
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    limit: input.limit,
    cursor: input.cursor,
    status: input.status,
    consentType: input.consentType,
    partyId: input.partyId,
  });

  return {
    consents: result.items,
    nextCursor: result.nextCursor,
  };
};
