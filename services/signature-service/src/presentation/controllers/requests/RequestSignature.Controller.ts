/**
 * @file RequestSignature.Controller.ts
 * @summary Request Signature controller
 * @description Handles requesting signature from a specific party
 */

import { createCommandController, createRequestsDependencies } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { RequestsCommandService } from "../../../app/services/Requests";
import { RequestSignatureBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { RequestSignatureControllerInput } from "../../../domain/types/requests/ControllerInputs";
import type { RequestSignatureAppResult } from "../../../domain/types/requests/AppServiceInputs";

/**
 * @description Request Signature controller
 */
export const RequestSignatureController = createCommandController<RequestSignatureControllerInput, RequestSignatureAppResult>({
  bodySchema: RequestSignatureBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: RequestsCommandService,
  createDependencies: (c: any) => makeRequestsCommandsPort(createRequestsDependencies(c)),
  extractParams: (path: any, body: any) => ({
    envelopeId: path.id,
    partyId: body.partyId,
    message: body.message,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = RequestSignatureController;








