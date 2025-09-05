/**
 * @file FinaliseEnvelope.Controller.ts
 * @summary Finalise Envelope controller
 * @description Handles finalizing an envelope and generating artifacts
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { DefaultRequestsCommandService } from "../../../app/services/Requests";
import { FinaliseEnvelopeBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { FinaliseEnvelopeControllerInput } from "../../../shared/types/requests/ControllerInputs";
import type { FinaliseEnvelopeAppResult } from "../../../shared/types/requests/AppServiceInputs";

/**
 * @description Finalise Envelope controller
 */
export const FinaliseEnvelopeController = createCommandController<FinaliseEnvelopeControllerInput, FinaliseEnvelopeAppResult>({
  bodySchema: FinaliseEnvelopeBody,
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
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = FinaliseEnvelopeController;
