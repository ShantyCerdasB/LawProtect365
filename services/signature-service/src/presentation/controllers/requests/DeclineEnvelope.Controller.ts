/**
 * @file DeclineEnvelope.Controller.ts
 * @summary Decline Envelope controller
 * @description Handles declining an envelope
 */

import { createCommandController, createRequestsDependencies } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { RequestsCommandService } from "../../../app/services/Requests";
import { DeclineEnvelopeBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { DeclineEnvelopeControllerInput } from "../../../domain/types/requests/ControllerInputs";
import type { DeclineEnvelopeAppResult } from "../../../domain/types/requests/AppServiceInputs";

/**
 * @description Decline Envelope controller
 */
export const DeclineEnvelopeController = createCommandController<DeclineEnvelopeControllerInput, DeclineEnvelopeAppResult>({
  bodySchema: DeclineEnvelopeBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: RequestsCommandService,
  createDependencies: (c: any) => makeRequestsCommandsPort(createRequestsDependencies(c)),
  extractParams: (path: any, body: any) => ({
    envelopeId: path.id,
    reason: body.reason}),
  responseType: "ok",
  includeActor: true});

// Export handler for backward compatibility
export const handler = DeclineEnvelopeController;

