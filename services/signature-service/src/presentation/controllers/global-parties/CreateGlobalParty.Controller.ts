/**
 * @file CreateGlobalParty.Controller.ts
 * @summary Create Global Party controller
 * @description Handles creation of new Global Parties (contacts)
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeGlobalPartiesCommandsPort } from "../../../app/adapters/global-parties/MakeGlobalPartiesCommandsPort";
import { DefaultGlobalPartiesCommandService } from "../../../app/services/GlobalParties";
import { CreateGlobalPartyBody } from "../../../presentation/schemas/global-parties/CreateGlobalParty.schema";
import type { CreateGlobalPartyControllerInput } from "../../../shared/types/global-parties/ControllerInputs";
import type { CreateGlobalPartyAppResult } from "../../../shared/types/global-parties/AppServiceInputs";

/**
 * @description Create Global Party controller
 */
export const CreateGlobalPartyController = createCommandController<CreateGlobalPartyControllerInput, CreateGlobalPartyAppResult>({
  bodySchema: CreateGlobalPartyBody,
  appServiceClass: DefaultGlobalPartiesCommandService,
  createDependencies: (c) => makeGlobalPartiesCommandsPort({
    globalParties: c.repos.globalParties,
    ids: c.ids,
    validationService: c.globalParties.validationService,
    auditService: c.globalParties.auditService,
    eventService: c.globalParties.eventService,
  }),
  extractParams: (_, body) => ({
    name: body.name,
    email: body.email,
    role: body.role,
    source: body.source,
    status: body.status,
    metadata: body.metadata,
    preferences: body.preferences,
    notificationPreferences: body.notificationPreferences,
    stats: body.stats || { signedCount: 0, totalEnvelopes: 0 },
  }),
  responseType: "created",
  includeActor: true,
});
