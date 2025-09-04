/**
 * @file GetEnvelopeStatusApp.service.ts
 * @summary App service for getting envelope status
 * @description Orchestrates envelope status retrieval using the query port
 */

import type { GetEnvelopeStatusControllerInput } from "../../../shared/types/envelopes/ControllerInputs";
import type { GetEnvelopeStatusAppResult } from "../../../shared/types/envelopes/AppServiceInputs";
import type { EnvelopesQueriesPort } from "../../ports/envelopes/EnvelopesQueriesPort";

/**
 * @summary App service for getting envelope status
 * @description Orchestrates envelope status retrieval using the query port
 */
export class GetEnvelopeStatusApp {
  constructor(private readonly queriesPort: EnvelopesQueriesPort) {}

  /**
   * @summary Gets envelope status
   * @param input - Input data for getting envelope status
   * @returns Promise resolving to the envelope status result
   */
  async execute(input: GetEnvelopeStatusControllerInput): Promise<GetEnvelopeStatusAppResult> {
    const result = await this.queriesPort.getStatus({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
    });

    if (result.status === "not_found") {
      throw new Error("Envelope not found");
    }

    // For status queries, we need to get the full envelope to get updatedAt
    const envelopeResult = await this.queriesPort.getById({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
    });

    if (!envelopeResult.envelope) {
      throw new Error("Envelope not found");
    }

    return {
      id: input.envelopeId,
      status: result.status,
      updatedAt: envelopeResult.envelope.updatedAt,
    };
  }
}

/**
 * @summary Factory function for creating GetEnvelopeStatusApp instances
 * @param dependencies - Dependencies required by the service
 * @returns Configured GetEnvelopeStatusApp instance
 */
export const getEnvelopeStatusApp = (
  input: GetEnvelopeStatusControllerInput,
  dependencies: {
    envelopesQueries: EnvelopesQueriesPort;
  }
): Promise<GetEnvelopeStatusAppResult> => {
  const service = new GetEnvelopeStatusApp(dependencies.envelopesQueries);
  return service.execute(input);
};
