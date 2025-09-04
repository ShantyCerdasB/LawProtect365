/**
 * @file UpdateEnvelopeApp.service.ts
 * @summary App service for updating envelopes
 * @description Orchestrates envelope updates using the command port
 */

import type { UpdateEnvelopeControllerInput } from "../../../shared/types/envelopes/ControllerInputs";
import type { UpdateEnvelopeAppResult } from "../../../shared/types/envelopes/AppServiceInputs";
import type { EnvelopesCommandsPort } from "../../ports/envelopes/EnvelopesCommandsPort";

/**
 * @summary App service for updating envelopes
 * @description Orchestrates envelope updates using the command port
 */
export class UpdateEnvelopeApp {
  constructor(private readonly commandsPort: EnvelopesCommandsPort) {}

  /**
   * @summary Updates an envelope
   * @param input - Input data for updating an envelope
   * @returns Promise resolving to the updated envelope result
   */
  async execute(input: UpdateEnvelopeControllerInput): Promise<UpdateEnvelopeAppResult> {
    const result = await this.commandsPort.update({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
      ownerId: "system" as any, // TODO: Get from auth context
      title: input.title,
      status: input.status,
    });

    return {
      id: result.envelope.envelopeId,
      title: result.envelope.title,
      status: result.envelope.status,
      updatedAt: result.envelope.updatedAt,
    };
  }
}

/**
 * @summary Factory function for creating UpdateEnvelopeApp instances
 * @param dependencies - Dependencies required by the service
 * @returns Configured UpdateEnvelopeApp instance
 */
export const updateEnvelopeApp = (
  input: UpdateEnvelopeControllerInput,
  dependencies: {
    envelopesCommands: EnvelopesCommandsPort;
  }
): Promise<UpdateEnvelopeAppResult> => {
  const service = new UpdateEnvelopeApp(dependencies.envelopesCommands);
  return service.execute(input);
};
