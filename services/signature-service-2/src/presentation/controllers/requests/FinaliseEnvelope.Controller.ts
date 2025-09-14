/**
 * @file FinaliseEnvelope.Controller.ts
 * @summary Finalise Envelope controller
 * @description Handles finalizing an envelope and generating artifacts
 */

import { createCommandController, createRequestsDependencies } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { RequestsCommandService } from "../../../app/services/Requests";
import { FinaliseEnvelopeBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { FinaliseEnvelopeControllerInput } from "../../../domain/types/requests/ControllerInputs";
import type { FinaliseEnvelopeAppResult } from "../../../domain/types/requests/AppServiceInputs";

/**
 * @description Finalise Envelope controller
 */
export const FinaliseEnvelopeController = createCommandController<FinaliseEnvelopeControllerInput, FinaliseEnvelopeAppResult>({
  bodySchema: FinaliseEnvelopeBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: RequestsCommandService,
  methodName: "finaliseEnvelope", // Added methodName to specify which method to call
  createDependencies: (c: any) => makeRequestsCommandsPort(createRequestsDependencies(c)),
  extractParams: (path: any, body: any, context: any) => ({
    envelopeId: path.id,
    message: body.message,
    inputs: body.inputs,
    actor: context.actor
  }),
  responseType: "ok",
  includeActor: true});

// Export handler for backward compatibility
export const handler = FinaliseEnvelopeController;

