/**
 * @file UpdateEnvelope.Controller.ts
 * @summary Update Envelope controller
 * @description Handles updating of existing Envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { EnvelopesCommandService } from "../../../app/services/envelopes";
import { UpdateEnvelopeBody, UpdateEnvelopeParams } from "../../../presentation/schemas/envelopes/UpdateEnvelope.schema";
import type { UpdateEnvelopeControllerInput } from "../../../domain/types/envelopes/ControllerInputs";
import type { UpdateEnvelopeAppResult } from "../../../domain/types/envelopes/AppServiceInputs";

/**
 * @description Update Envelope controller
 */
export const UpdateEnvelopeController = createCommandController<UpdateEnvelopeControllerInput, UpdateEnvelopeAppResult>({
  bodySchema: UpdateEnvelopeBody,
  pathSchema: UpdateEnvelopeParams,
  appServiceClass: EnvelopesCommandService,
  createDependencies: (c: any) => c.envelopes.commandsPort,
  extractParams: (path: any, body: any) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    title: body.title,
    status: body.status,
  }),
  responseType: "ok",
  includeActor: true,
});








