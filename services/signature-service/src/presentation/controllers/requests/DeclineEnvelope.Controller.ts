/**
 * @file DeclineEnvelope.Controller.ts
 * @summary Decline Envelope controller
 * @description Handles declining an envelope
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
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
  createDependencies: (c) => makeRequestsCommandsPort(
    c.repos.envelopes,
    c.repos.parties,
    c.repos.inputs,
    c.requests.validationService,
    c.requests.auditService,
    c.requests.eventService,
    c.requests.rateLimitService,
    c.ids,
    c.storage.presigner
  ),
  extractParams: (path, body) => ({
    envelopeId: path.id,
    reason: body.reason,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = DeclineEnvelopeController;
