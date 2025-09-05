/**
 * @file RemindParties.Controller.ts
 * @summary Remind Parties controller
 * @description Handles sending reminders to parties for envelope signing
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { DefaultRequestsCommandService } from "../../../app/services/Requests";
import { RemindersBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { RemindPartiesControllerInput } from "../../../shared/types/requests/ControllerInputs";
import type { RemindPartiesAppResult } from "../../../shared/types/requests/AppServiceInputs";

/**
 * @description Remind Parties controller
 */
export const RemindPartiesController = createCommandController<RemindPartiesControllerInput, RemindPartiesAppResult>({
  bodySchema: RemindersBody,
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
    partyIds: body.partyIds,
    message: body.message,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = RemindPartiesController;
