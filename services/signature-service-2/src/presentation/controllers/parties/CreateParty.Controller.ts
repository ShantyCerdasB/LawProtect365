/**
 * @file CreateParty.Controller.ts
 * @summary Create Party controller
 * @description Handles creation of new Parties in envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { PartiesCommandService } from "../../../app/services/Parties";
import { CreatePartyBody, CreatePartyParams } from "../../../presentation/schemas/parties/CreateParty.schema";
import type { CreatePartyControllerInput } from "../../../domain/types/parties/ControllerInputs";
import type { CreatePartyResult } from "../../../app/ports/parties";

/**
 * @description Create Party controller
 */
export const CreatePartyController = createCommandController<CreatePartyControllerInput, CreatePartyResult>({
  bodySchema: CreatePartyBody,
  pathSchema: CreatePartyParams,
  appServiceClass: PartiesCommandService,
  createDependencies: (c: any) => c.parties.command, // Use the service from container
  extractParams: (path: any, body: any, context: any) => {
    const params = {
      envelopeId: path.envelopeId,
      name: body.name,
      email: body.email,
      role: body.role,
      sequence: body.sequence
    };
    
    // Add authorization validation
    if (context?.actor?.email) {
      (params as any).actorEmail = context.actor.email;
    }
    
    return params;
  },
  responseType: "created",
  includeActor: true,
  methodName: "create"});

