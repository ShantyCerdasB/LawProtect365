/**
 * @file DeleteEnvelopeApp.service.ts
 * @summary App service for deleting envelopes
 * @description Orchestrates envelope deletion using the command port
 */

import type { DeleteEnvelopeControllerInput } from "../../../shared/types/envelopes/ControllerInputs";
import type { DeleteEnvelopeAppResult } from "../../../shared/types/envelopes/AppServiceInputs";
import type { EnvelopesCommandsPort } from "../../ports/envelopes/EnvelopesCommandsPort";

/**
 * @summary App service for deleting envelopes
 * @description Orchestrates envelope deletion using the command port
 */
export class DeleteEnvelopeApp {
  constructor(private readonly commandsPort: EnvelopesCommandsPort) {}

  /**
   * @summary Deletes an envelope
   * @param input - Input data for deleting an envelope
   * @returns Promise resolving to the deletion result
   */
  async execute(input: DeleteEnvelopeControllerInput): Promise<DeleteEnvelopeAppResult> {
    const result = await this.commandsPort.delete({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
      ownerId: "system" as any, // TODO: Get from auth context
    });

    return {
      deleted: result.deleted,
      envelopeId: input.envelopeId,
    };
  }
}

/**
 * @summary Factory function for creating DeleteEnvelopeApp instances
 * @param dependencies - Dependencies required by the service
 * @returns Configured DeleteEnvelopeApp instance
 */
export const deleteEnvelopeApp = (
  input: DeleteEnvelopeControllerInput,
  dependencies: {
    envelopesCommands: EnvelopesCommandsPort;
  }
): Promise<DeleteEnvelopeAppResult> => {
  const service = new DeleteEnvelopeApp(dependencies.envelopesCommands);
  return service.execute(input);
};
