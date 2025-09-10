/**
 * @file PrepareSigning.Controller.ts
 * @summary Prepare Signing controller
 * @description Handles signing preparation operations
 */

import { createCommandController, extractEnvelopeParams } from "../../../shared/controllers/controllerFactory";
import { SigningCommandService } from "../../../app/services/Signing";
import { PrepareSigningBody } from "../../../presentation/schemas/signing/PrepareSigning.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { PrepareSigningControllerInput } from "../../../domain/types/signing/ControllerInputs";
import type { PrepareSigningResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Prepare Signing controller
 */
export const PrepareSigningController = createCommandController<PrepareSigningControllerInput, PrepareSigningResult>({
  bodySchema: PrepareSigningBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: SigningCommandService,
  createDependencies: (c: any) => c.signing.commandsPort,
  extractParams: (path: any, body: any) => ({
    ...extractEnvelopeParams(path, body),
    signerId: body.signerId,
    token: "", // Will be injected by factory
  }),
  responseType: "ok",
  methodName: "prepareSigning"});

// Export handler for backward compatibility
export const handler = PrepareSigningController;

