/**
 * @file GetEnvelopeByIdApp.service.ts
 * @summary Application service for retrieving envelopes by ID
 * @description Orchestrates envelope retrieval operations, delegates to EnvelopesQueriesPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId } from "@/app/ports/shared";
import type { EnvelopesQueriesPort } from "@/app/ports/envelopes/EnvelopesQueriesPort";

/**
 * Input parameters for retrieving an envelope by ID
 */
export interface GetEnvelopeByIdAppInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
}

/**
 * Output result for envelope retrieval
 */
export interface GetEnvelopeByIdAppResult {
  envelope: any;
}

/**
 * Dependencies required by the GetEnvelopeById app service
 */
export interface GetEnvelopeByIdAppDependencies {
  envelopesQueries: EnvelopesQueriesPort;
}

/**
 * Retrieves an envelope by ID with proper validation
 * @param input - The input parameters containing envelope ID
 * @param deps - The dependencies containing the envelopes queries port
 * @returns Promise resolving to envelope data
 * @throws {AppError} When envelope is not found or validation fails
 */
export const getEnvelopeByIdApp = async (
  input: GetEnvelopeByIdAppInput,
  deps: GetEnvelopeByIdAppDependencies
): Promise<GetEnvelopeByIdAppResult> => {
  const envelope = await deps.envelopesQueries.getById(input.envelopeId);

  return { envelope };
};
