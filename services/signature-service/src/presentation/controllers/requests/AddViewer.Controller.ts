/**
 * @file AddViewer.Controller.ts
 * @summary Add Viewer controller
 * @description Handles adding a viewer to an envelope
 */

import { createCommandController, createRequestsDependencies } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { RequestsCommandService } from "../../../app/services/Requests";
import { AddViewerBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { AddViewerControllerInput } from "../../../domain/types/requests/ControllerInputs";
import type { AddViewerAppResult } from "../../../domain/types/requests/AppServiceInputs";

/**
 * @description Add Viewer controller
 */
export const AddViewerController = createCommandController<AddViewerControllerInput, AddViewerAppResult>({
  bodySchema: AddViewerBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: RequestsCommandService,
  createDependencies: (c: any) => makeRequestsCommandsPort(createRequestsDependencies(c)),
  extractParams: (path: any, body: any) => ({
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








