/**
 * @file RequestSignature.Controller.ts
 * @summary Request Signature controller
 * @description Handles requesting signature from a specific party
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { DefaultRequestsCommandService } from "../../../app/services/Requests";
import { RequestSignatureBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { RequestSignatureControllerInput } from "../../../shared/types/requests/ControllerInputs";
import type { RequestSignatureAppResult } from "../../../shared/types/requests/AppServiceInputs";

/**
 * @description Request Signature controller
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
    c.requests.rateLimitService,
    c.ids,
    c.storage.presigner
  ),
  extractParams: (path, body) => ({
    envelopeId: path.id,
    partyId: body.partyId,
    message: body.message,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = RequestSignatureController;
