/**
 * @file finalise.ts
 * @summary Finalise envelope controller
 * @description Handles finalizing an envelope
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { DefaultRequestsCommandService } from "../../../app/services/Requests";
import { FinaliseEnvelopeBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { FinaliseEnvelopeControllerInput } from "../../../shared/types/requests/ControllerInputs";
import type { FinaliseEnvelopeAppResult } from "../../../shared/types/requests/AppServiceInputs";

/**
 * @description Finalise envelope controller
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
    c.requests.rateLimitService
  ),
  extractParams: (path, body) => ({
    envelopeId: path.id,
    message: body.message,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = FinaliseEnvelopeController;
