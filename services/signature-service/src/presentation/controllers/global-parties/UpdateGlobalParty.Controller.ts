/**
 * @file UpdateGlobalParty.Controller.ts
 * @summary Update Global Party controller
 * @description Handles updating of existing Global Parties (contacts)
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeGlobalPartiesCommandsPort } from "../../../app/adapters/global-parties/MakeGlobalPartiesCommandsPort";
import { GlobalPartiesCommandService } from "../../../app/services/GlobalParties";
import { UpdateGlobalPartyBody } from "../../../presentation/schemas/global-parties/UpdateGlobalParty.schema";
import type { UpdateGlobalPartyControllerInput } from "../../../domain/types/global-parties/ControllerInputs";
import type { UpdateGlobalPartyAppResult } from "../../../domain/types/global-parties/AppServiceInputs";

/**
 * @description Update Global Party controller
 */
export const UpdateGlobalPartyController = createCommandController<UpdateGlobalPartyControllerInput, UpdateGlobalPartyAppResult>({
  bodySchema: UpdateGlobalPartyBody,
  appServiceClass: GlobalPartiesCommandService,
  createDependencies: (c: any) => makeGlobalPartiesCommandsPort({
    globalParties: c.repos.globalParties,
    ids: c.ids,
    validationService: c.globalParties.validationService,
    auditService: c.globalParties.auditService,
    eventService: c.globalParties.eventService,
  }),
  extractParams: (_: any, body: any) => ({
    partyId: body.partyId,
    updates: {
      name: body.updates?.name,
      email: body.updates?.email,
      role: body.updates?.role,
      source: body.updates?.source,
      status: body.updates?.status,
      metadata: body.updates?.metadata,
      preferences: body.updates?.preferences,
      notificationPreferences: body.updates?.notificationPreferences,
    },
  }),
  responseType: "ok",
  includeActor: true,
});








