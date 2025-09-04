/**
 * @file remind.ts
 * @summary Remind parties controller
 * @description Handles sending reminders to parties about an envelope
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { DefaultRequestsCommandService } from "../../../app/services/Requests";
import { RemindersBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { RemindPartiesControllerInput } from "../../../shared/types/requests/ControllerInputs";
import type { RemindPartiesAppResult } from "../../../shared/types/requests/AppServiceInputs";

/**
 * @description Remind parties controller
 */
export const RemindPartiesController = createCommandController<RemindPartiesControllerInput, RemindPartiesAppResult>({
  bodySchema: RemindersBody,
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
    partyIds: body.partyIds,
    message: body.message,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = RemindPartiesController;
