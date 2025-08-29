/**
 * @file GetEnvelopeStatusApp.service.ts
 * @summary Application service for getting envelope status
 * @description Orchestrates envelope status retrieval operations, delegates to EnvelopesQueriesPort,
 * and handles status aggregation logic. Uses branded types for type safety.
 */

import type { TenantId, EnvelopeId } from "@/app/ports/shared";
import type { EnvelopesQueriesPort } from "@/app/ports/envelopes/EnvelopesQueriesPort";

/**
 * Input parameters for getting envelope status
 */
export interface GetEnvelopeStatusAppInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
}

/**
 * Output result for envelope status
 */
export interface GetEnvelopeStatusAppResult {
  envelopeId: EnvelopeId;
  status: string;
}

/**
 * Dependencies required by the GetEnvelopeStatus app service
 */
export interface GetEnvelopeStatusAppDependencies {
  envelopesQueries: EnvelopesQueriesPort;
}

/**
 * Returns consolidated status for an envelope
 * @param input - The input parameters containing envelope ID
 * @param deps - The dependencies containing the envelopes queries port
 * @returns Promise resolving to envelope status data
 * @throws {AppError} When envelope is not found or validation fails
 */
export const getEnvelopeStatusApp = async (
  input: GetEnvelopeStatusAppInput,
  deps: GetEnvelopeStatusAppDependencies
): Promise<GetEnvelopeStatusAppResult> => {
  const envelope = await deps.envelopesQueries.getById(input.envelopeId);
  
  return {
    envelopeId: input.envelopeId,
    status: envelope.status,
  };
};
