/**
 * @file DeleteEnvelope.Controller.ts
 * @summary Delete Envelope controller
 * @description Handles deletion of existing Envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { EnvelopesCommandService } from "../../../app/services/envelopes";
import { DeleteEnvelopeParams } from "../../../presentation/schemas/envelopes/DeleteEnvelope.schema";
import type { DeleteEnvelopeControllerInput } from "../../../shared/types/envelopes/ControllerInputs";
import type { DeleteEnvelopeAppResult } from "../../../shared/types/envelopes/AppServiceInputs";

/**
 * @description Delete Envelope controller
 */
export const DeleteEnvelopeController = createCommandController<DeleteEnvelopeControllerInput, DeleteEnvelopeAppResult>({
  pathSchema: DeleteEnvelopeParams,
  appServiceClass: EnvelopesCommandService,
  createDependencies: (c) => c.envelopes.commandsPort,
  extractParams: (path) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
  }),
  responseType: "ok",
  includeActor: true,
});
