/**
 * @file PrepareSigning.Controller.ts
 * @summary Prepare Signing controller
 * @description Handles signing preparation operations
 */

import { createCommandController, createSigningDependencies, extractEnvelopeParams } from "../../../shared/controllers/controllerFactory";
import { makeSigningCommandsPort } from "../../../app/adapters/signing/makeSigningCommandsPort";
import { DefaultSigningCommandService } from "../../../app/services/Signing";
import { PrepareSigningBody } from "../../../presentation/schemas/signing/PrepareSigning.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { PrepareSigningControllerInput } from "../../../shared/types/signing/ControllerInputs";
import type { PrepareSigningResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Prepare Signing controller
 */
export const PrepareSigningController = createCommandController<PrepareSigningControllerInput, PrepareSigningResult>({
  bodySchema: PrepareSigningBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultSigningCommandService,
  createDependencies: (c) => makeSigningCommandsPort(
    c.repos.envelopes,
    c.repos.parties,
    createSigningDependencies(c, true) // Include S3 service
  ),
  extractParams: (path, body) => ({
    ...extractEnvelopeParams(path, body),
    signerId: body.signerId,
    token: "", // Will be injected by factory
  }),
  responseType: "ok",
});

// Export handler for backward compatibility
export const handler = PrepareSigningController;
