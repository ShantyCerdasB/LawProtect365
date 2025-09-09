/**
 * @file CancelEnvelope.Controller.ts
 * @summary Cancel Envelope controller
 * @description Handles canceling an envelope
 */

import { createCommandController, createRequestsDependencies } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { DefaultRequestsCommandService } from "../../../app/services/Requests";
import { CancelEnvelopeBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { CancelEnvelopeControllerInput } from "../../../domain/types/requests/ControllerInputs";
import type { CancelEnvelopeAppResult } from "../../../domain/types/requests/AppServiceInputs";

/**
 * @description Cancel Envelope controller
 */
export const CancelEnvelopeController = createCommandController<CancelEnvelopeControllerInput, CancelEnvelopeAppResult>({
  bodySchema: CancelEnvelopeBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultRequestsCommandService,
  createDependencies: (c: any) => makeRequestsCommandsPort(createRequestsDependencies(c)),
  extractParams: (path: any, body: any) => ({
    envelopeId: path.id,
    reason: body.reason,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = CancelEnvelopeController;








