/**
 * @file UpdateParty.Controller.ts
 * @summary Update Party controller
 * @description Handles updating of existing Parties in envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { DefaultPartiesCommandService } from "../../../app/services/Parties";
import { UpdatePartyBody, UpdatePartyParams } from "../../../presentation/schemas/parties/UpdateParty.schema";
import type { UpdatePartyControllerInput } from "../../../domain/types/parties/ControllerInputs";
import type { UpdatePartyResult } from "../../../app/ports/parties";

/**
 * @description Update Party controller
 */
export const UpdatePartyController = createCommandController<UpdatePartyControllerInput, UpdatePartyResult>({
  bodySchema: UpdatePartyBody,
  pathSchema: UpdatePartyParams,
  appServiceClass: DefaultPartiesCommandService,
  createDependencies: (c: any) => c.parties.commandsPort,
  extractParams: (path: any, body: any) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    partyId: path.partyId,
    name: body.name,
    email: body.email,
    role: body.role,
    sequence: body.sequence,
  }),
  responseType: "ok",
  includeActor: true,
});








