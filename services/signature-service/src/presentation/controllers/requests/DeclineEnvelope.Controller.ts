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
  createDependencies: (c) => makeRequestsCommandsPort({
    repositories: {
      envelopes: c.repos.envelopes,
      parties: c.repos.parties,
      inputs: c.repos.inputs
    },
    services: {
      validation: c.requests.validationService,
      audit: c.requests.auditService,
      event: c.requests.eventService,
      rateLimit: c.requests.rateLimitService
    },
    infrastructure: {
      ids: c.ids,
      s3Presigner: c.storage.presigner
    }
  }),
  extractParams: (path, body) => ({
    envelopeId: path.id,
    reason: body.reason,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = DeclineEnvelopeController;
