/**
 * @file DeleteGlobalParty.Controller.ts
 * @summary Delete Global Party controller
 * @description Handles deletion of Global Parties (contacts)
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeGlobalPartiesCommandsPort } from "../../../app/adapters/global-parties/MakeGlobalPartiesCommandsPort";
import { DefaultGlobalPartiesCommandService } from "../../../app/services/GlobalParties";
import { DeleteGlobalPartyParams } from "../../../presentation/schemas/global-parties/DeleteGlobalParty.schema";
import type { DeleteGlobalPartyControllerInput } from "../../../shared/types/global-parties/ControllerInputs";
import type { DeleteGlobalPartyAppResult } from "../../../shared/types/global-parties/AppServiceInputs";

/**
 * @description Delete Global Party controller
 */
export const DeleteGlobalPartyController = createCommandController<DeleteGlobalPartyControllerInput, DeleteGlobalPartyAppResult>({
  pathSchema: DeleteGlobalPartyParams,
  appServiceClass: DefaultGlobalPartiesCommandService,
  createDependencies: (c) => makeGlobalPartiesCommandsPort({
    globalParties: c.repos.globalParties,
    ids: c.ids,
    validationService: c.globalParties.validationService,
    auditService: c.globalParties.auditService,
    eventService: c.globalParties.eventService,
  }),
  extractParams: (path) => ({
    partyId: path.partyId,
  }),
  responseType: "noContent",
  includeActor: true,
});
