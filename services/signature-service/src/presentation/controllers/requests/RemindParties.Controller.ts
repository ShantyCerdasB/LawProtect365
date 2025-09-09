/**
 * @file RemindParties.Controller.ts
 * @summary Remind Parties controller
 * @description Handles sending reminders to parties for envelope signing
 */

import { createCommandController, createRequestsDependencies } from "../../../shared/controllers/controllerFactory";
import { makeRequestsCommandsPort } from "../../../app/adapters/requests/makeRequestsCommandsPort";
import { DefaultRequestsCommandService } from "../../../app/services/Requests";
import { RemindersBody } from "../../../presentation/schemas/requests";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { RemindPartiesControllerInput } from "../../../domain/types/requests/ControllerInputs";
import type { RemindPartiesAppResult } from "../../../domain/types/requests/AppServiceInputs";

/**
 * @description Remind Parties controller
 */
export const RemindPartiesController = createCommandController<RemindPartiesControllerInput, RemindPartiesAppResult>({
  bodySchema: RemindersBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultRequestsCommandService,
  createDependencies: (c: any) => makeRequestsCommandsPort(createRequestsDependencies(c)),
  extractParams: (path: any, body: any) => ({
    envelopeId: path.id,
    partyIds: body.partyIds,
    message: body.message,
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = RemindPartiesController;








