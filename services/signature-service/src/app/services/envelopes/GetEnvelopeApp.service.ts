/**
 * @file GetEnvelopeApp.service.ts
 * @summary App service for getting envelopes by ID
 * @description Orchestrates envelope retrieval using the query port
 */

import type { GetEnvelopeControllerInput } from "../../../shared/types/envelopes/ControllerInputs";
import type { GetEnvelopeAppResult } from "../../../shared/types/envelopes/AppServiceInputs";
import type { EnvelopesQueriesPort } from "../../ports/envelopes/EnvelopesQueriesPort";

/**
 * @summary App service for getting envelopes by ID
 * @description Orchestrates envelope retrieval using the query port
 */
export class GetEnvelopeApp {
  constructor(private readonly queriesPort: EnvelopesQueriesPort) {}

  /**
   * @summary Gets an envelope by ID
   * @param input - Input data for getting an envelope
   * @returns Promise resolving to the envelope result
   */
  async execute(input: GetEnvelopeControllerInput): Promise<GetEnvelopeAppResult> {
    const result = await this.queriesPort.getById({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
    });

    if (!result.envelope) {
      throw new Error("Envelope not found");
    }

    const envelope = result.envelope;
    return {
      id: envelope.envelopeId,
      title: envelope.title,
      status: envelope.status,
      createdAt: envelope.createdAt,
      updatedAt: envelope.updatedAt,
      ownerId: envelope.ownerId,
      parties: envelope.parties,
      documents: envelope.documents,
    };
  }
}

/**
 * @summary Factory function for creating GetEnvelopeApp instances
 * @param dependencies - Dependencies required by the service
 * @returns Configured GetEnvelopeApp instance
 */
export const getEnvelopeApp = (
  input: GetEnvelopeControllerInput,
  dependencies: {
    envelopesQueries: EnvelopesQueriesPort;
  }
): Promise<GetEnvelopeAppResult> => {
  const service = new GetEnvelopeApp(dependencies.envelopesQueries);
  return service.execute(input);
};
