/**
 * @file requestSignature.ts
 * @summary Request signature controller
 * @description Handles requesting a signature from a specific party
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { DefaultRequestsCommandService } from "../../../app/services/Requests";
import { RequestSignatureBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { RequestSignatureControllerInput } from "../../../shared/types/requests/ControllerInputs";
import type { RequestSignatureAppResult } from "../../../shared/types/requests/AppServiceInputs";

/**
 * @description Request signature controller
 */
export const RequestSignatureController = createCommandController<RequestSignatureControllerInput, RequestSignatureAppResult>({
  bodySchema: RequestSignatureBody,
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
    partyId: body.partyId,
    message: body.message,
    channel: body.channel,
  }),
  responseType: "created",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = RequestSignatureController;
