/**
 * @file AddViewer.Controller.ts
 * @summary Add Viewer controller
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
 * @description Add Viewer controller
 */
export const AddViewerController = createCommandController<AddViewerControllerInput, AddViewerAppResult>({
  bodySchema: AddViewerBody,
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
    email: body.email,
    name: body.name,
    locale: body.locale,
  }),
  responseType: "created",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = AddViewerController;
