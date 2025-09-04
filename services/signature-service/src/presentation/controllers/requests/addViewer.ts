/**
 * @file addViewer.ts
 * @summary Add viewer controller
 * @description Handles adding a viewer to an envelope
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { DefaultRequestsCommandService } from "../../../app/services/Requests";
import { AddViewerBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { AddViewerControllerInput } from "../../../shared/types/requests/ControllerInputs";
import type { AddViewerAppResult } from "../../../shared/types/requests/AppServiceInputs";

/**
 * @description Add viewer controller
 */
export const AddViewerController = createCommandController<AddViewerControllerInput, AddViewerAppResult>({
  bodySchema: AddViewerBody,
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
    email: body.email,
    name: body.name,
    locale: body.locale,
  }),
  responseType: "created",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = AddViewerController;
