/**
 * @file DeleteParty.Controller.ts
 * @summary Delete Party controller
 * @description Handles deletion of Parties from envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { PartiesCommandService } from "../../../app/services/Parties";
import { DeletePartyParams } from "../../../presentation/schemas/parties/DeleteParty.schema";
import type { DeletePartyControllerInput } from "../../../domain/types/parties/ControllerInputs";
import type { DeletePartyResult } from "../../../app/ports/parties";

/**
 * @description Delete Party controller
 */
export const DeletePartyController = createCommandController<DeletePartyControllerInput, DeletePartyResult>({
  pathSchema: DeletePartyParams,
  appServiceClass: PartiesCommandService,
  createDependencies: (c: any) => c.parties.commandsPort,
  extractParams: (path: any) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    partyId: path.partyId,
  }),
  responseType: "noContent",
  includeActor: true,
});








