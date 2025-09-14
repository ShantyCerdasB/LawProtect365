/**
 * @file CreateEnvelope.Controller.ts
 * @summary Create Envelope controller
 * @description Handles creation of new Envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { EnvelopesCommandService } from "../../../app/services/envelopes";
import { CreateEnvelopeBody, CreateEnvelopeParams } from "../../../presentation/schemas/envelopes/CreateEnvelope.schema";
import type { CreateEnvelopeControllerInput } from "../../../domain/types/envelopes/ControllerInputs";
import type { CreateEnvelopeAppResult } from "../../../domain/types/envelopes/AppServiceInputs";

/**
 * @description Create Envelope controller
 */
export const CreateEnvelopeController = createCommandController<CreateEnvelopeControllerInput, CreateEnvelopeAppResult>({
  bodySchema: CreateEnvelopeBody,
  pathSchema: CreateEnvelopeParams,
  appServiceClass: EnvelopesCommandService,
  createDependencies: (c: any) => c.envelopes.commandsPort,
  extractParams: (_path: any, body: any, context: any) => ({
    ownerEmail: body.ownerEmail,
    name: body.name,
    actorEmail: context.actor?.email
  }),
  responseType: "created",
  includeActor: true,
  methodName: "create"});

