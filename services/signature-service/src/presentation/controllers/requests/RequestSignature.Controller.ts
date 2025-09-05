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
    partyId: body.partyId,
    message: body.message,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = RequestSignatureController;
