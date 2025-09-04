/**
 * @file CreateEnvelopeApp.service.ts
 * @summary App service for creating envelopes
 * @description Orchestrates envelope creation using the command port
 */

import type { CreateEnvelopeControllerInput } from "../../../shared/types/envelopes/ControllerInputs";
import type { CreateEnvelopeAppResult } from "../../../shared/types/envelopes/AppServiceInputs";
import type { EnvelopesCommandsPort } from "../../ports/envelopes/EnvelopesCommandsPort";

/**
 * @summary App service for creating envelopes
 * @description Orchestrates envelope creation using the command port
 */
export class CreateEnvelopeApp {
  constructor(
    private readonly commandsPort: EnvelopesCommandsPort
  ) {}

  /**
   * @summary Creates a new envelope
   * @param input - Input data for creating an envelope
   * @returns Promise resolving to the created envelope result
   */
  async execute(input: CreateEnvelopeControllerInput): Promise<CreateEnvelopeAppResult> {
    const result = await this.commandsPort.create({
      tenantId: input.tenantId,
      ownerId: input.ownerId,
      title: input.title,
      status: "draft",
    });

    return {
      envelopeId: result.envelope.envelopeId,
      createdAt: result.envelope.createdAt,
    };
  }
}

/**
 * @summary Factory function for creating CreateEnvelopeApp instances
 * @param dependencies - Dependencies required by the service
 * @returns Configured CreateEnvelopeApp instance
 */
export const createEnvelopeApp = (
  input: CreateEnvelopeControllerInput,
  dependencies: {
    envelopesCommands: EnvelopesCommandsPort;
  }
): Promise<CreateEnvelopeAppResult> => {
  const service = new CreateEnvelopeApp(dependencies.envelopesCommands);
  return service.execute(input);
};
