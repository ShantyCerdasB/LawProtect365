/**
 * @file DeclineSigning.Controller.ts
 * @summary Decline Signing controller
 * @description Handles signing decline requests
 */

import { createCommandController, extractEnvelopeParams } from "../../../shared/controllers/controllerFactory";
import { SigningCommandService } from "../../../app/services/Signing";
import { DeclineSigningBody } from "../../../presentation/schemas/signing/DeclineSigning.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { DeclineSigningControllerInput } from "../../../domain/types/signing/ControllerInputs";
import type { DeclineSigningResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Decline Signing controller
 */
export const DeclineSigningController = createCommandController<DeclineSigningControllerInput, DeclineSigningResult>({
  bodySchema: DeclineSigningBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: SigningCommandService,
  createDependencies: (c: any) => c.signing.commandsPort,
  extractParams: (path: any, body: any) => ({
    ...extractEnvelopeParams(path, body),
    signerId: body.signerId,
    reason: body.reason,
    token: "", // Will be injected by factory
  }),
  responseType: "ok",
});

// Export handler for backward compatibility
export const handler = DeclineSigningController;








