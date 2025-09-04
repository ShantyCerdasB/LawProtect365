/**
 * @file ListEnvelopesApp.service.ts
 * @summary App service for listing envelopes
 * @description Orchestrates envelope listing using the query port
 */

import type { ListEnvelopesControllerInput } from "../../../shared/types/envelopes/ControllerInputs";
import type { ListEnvelopesAppResult } from "../../../shared/types/envelopes/AppServiceInputs";
import type { EnvelopesQueriesPort } from "../../ports/envelopes/EnvelopesQueriesPort";

/**
 * @summary App service for listing envelopes
 * @description Orchestrates envelope listing using the query port
 */
export class ListEnvelopesApp {
  constructor(private readonly queriesPort: EnvelopesQueriesPort) {}

  /**
   * @summary Lists envelopes with pagination
   * @param input - Input data for listing envelopes
   * @returns Promise resolving to the envelope list result
   */
  async execute(input: ListEnvelopesControllerInput): Promise<ListEnvelopesAppResult> {
    const result = await this.queriesPort.list({
      tenantId: input.tenantId,
      limit: input.limit,
      cursor: input.cursor,
    });

    return {
      items: result.items.map(envelope => ({
        id: envelope.envelopeId,
        title: envelope.title,
        status: envelope.status,
        createdAt: envelope.createdAt,
        updatedAt: envelope.updatedAt,
        ownerId: envelope.ownerId,
        partiesCount: envelope.parties.length,
        documentsCount: envelope.documents.length,
      })),
      nextCursor: result.nextCursor,
    };
  }
}

/**
 * @summary Factory function for creating ListEnvelopesApp instances
 * @param dependencies - Dependencies required by the service
 * @returns Configured ListEnvelopesApp instance
 */
export const listEnvelopesApp = (
  input: ListEnvelopesControllerInput,
  dependencies: {
    envelopesQueries: EnvelopesQueriesPort;
  }
): Promise<ListEnvelopesAppResult> => {
  const service = new ListEnvelopesApp(dependencies.envelopesQueries);
  return service.execute(input);
};
