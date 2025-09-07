/**
 * @file DeclineEnvelope.Controller.ts
 * @summary Decline Envelope controller
 * @description Handles declining an envelope
 */

import { createCommandController, createRequestsDependencies } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { DefaultRequestsCommandService } from "../../../app/services/Requests";
import { DeclineEnvelopeBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { DeclineEnvelopeControllerInput } from "../../../shared/types/requests/ControllerInputs";
import type { DeclineEnvelopeAppResult } from "../../../shared/types/requests/AppServiceInputs";

/**
 * @description Decline Envelope controller
 */
export const DeclineEnvelopeController = createCommandController<DeclineEnvelopeControllerInput, DeclineEnvelopeAppResult>({
  bodySchema: DeclineEnvelopeBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultRequestsCommandService,
  createDependencies: (c) => makeRequestsCommandsPort(createRequestsDependencies(c)),
  extractParams: (path, body) => ({
    envelopeId: path.id,
    reason: body.reason,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = DeclineEnvelopeController;
