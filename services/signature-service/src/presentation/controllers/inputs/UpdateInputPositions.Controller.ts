/**
 * @file UpdateInputPositions.Controller.ts
 * @summary Update Input Positions controller
 * @description Handles updating positions of multiple Inputs in batch
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { DefaultInputsCommandService } from "../../../app/services/Inputs";
import { PatchInputPositionsBody, EnvelopePath } from "../../../presentation/schemas/inputs";
import type { UpdateInputPositionsCommand, UpdateInputPositionsResult } from "../../../app/ports/inputs/InputsCommandsPort";

/**
 * @description Update Input Positions controller
 */
export const UpdateInputPositionsController = createCommandController<UpdateInputPositionsCommand, UpdateInputPositionsResult>({
  bodySchema: PatchInputPositionsBody,
  pathSchema: EnvelopePath,
  appServiceClass: DefaultInputsCommandService,
  createDependencies: (c) => c.inputs.commandsPort,
  extractParams: (path, body) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    items: body.items,
  }),
  responseType: "ok",
  includeActor: true,
});
