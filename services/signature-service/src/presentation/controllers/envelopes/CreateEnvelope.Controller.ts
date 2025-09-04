/**
 * @file CreateEnvelope.Controller.ts
 * @summary Create Envelope controller
 * @description Handles creation of new Envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { EnvelopesCommandService } from "../../../app/services/envelopes";
import { CreateEnvelopeBody, CreateEnvelopeParams } from "../../../presentation/schemas/envelopes/CreateEnvelope.schema";
import type { CreateEnvelopeControllerInput } from "../../../shared/types/envelopes/ControllerInputs";
import type { CreateEnvelopeAppResult } from "../../../shared/types/envelopes/AppServiceInputs";

/**
 * @description Create Envelope controller
 */
export const CreateEnvelopeController = createCommandController<CreateEnvelopeControllerInput, CreateEnvelopeAppResult>({
  bodySchema: CreateEnvelopeBody,
  pathSchema: CreateEnvelopeParams,
  appServiceClass: EnvelopesCommandService,
  createDependencies: (c) => c.envelopes.commandsPort,
  extractParams: (path, body) => ({
    tenantId: path.tenantId,
    ownerId: body.ownerId,
    title: body.name,
    description: body.description,
  }),
  responseType: "created",
  includeActor: true,
});
