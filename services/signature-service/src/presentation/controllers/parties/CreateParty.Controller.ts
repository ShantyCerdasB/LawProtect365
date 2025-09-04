/**
 * @file CreateParty.Controller.ts
 * @summary Create Party controller
 * @description Handles creation of new Parties in envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { DefaultPartiesCommandService } from "../../../app/services/Parties";
import { CreatePartyBody, CreatePartyParams } from "../../../presentation/schemas/parties/CreateParty.schema";
import type { CreatePartyControllerInput } from "../../../shared/types/parties/ControllerInputs";
import type { CreatePartyResult } from "../../../app/ports/parties";

/**
 * @description Create Party controller
 */
export const CreatePartyController = createCommandController<CreatePartyControllerInput, CreatePartyResult>({
  bodySchema: CreatePartyBody,
  pathSchema: CreatePartyParams,
  appServiceClass: DefaultPartiesCommandService,
  createDependencies: (c) => c.parties.commandsPort,
  extractParams: (path, body) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    name: body.name,
    email: body.email,
    role: body.role,
    sequence: body.sequence,
  }),
  responseType: "created",
  includeActor: true,
});
