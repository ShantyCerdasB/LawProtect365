/**
 * @file UpdateInputPositions.Controller.ts
 * @summary Update Input Positions controller
 * @description Handles updating positions of multiple Inputs in batch
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { InputsCommandService } from "../../../app/services/Inputs";
import { PatchInputPositionsBody, EnvelopePath } from "../../../presentation/schemas/inputs";
import type { UpdateInputPositionsResult } from "../../../app/ports/inputs/InputsCommandsPort";
import type { UpdateInputPositionsControllerInput } from "@/domain/types/inputs";

/**
 * @description Update Input Positions controller
 */
export const UpdateInputPositionsController = createCommandController<UpdateInputPositionsControllerInput, UpdateInputPositionsResult>({
  bodySchema: PatchInputPositionsBody,
  pathSchema: EnvelopePath,
  appServiceClass: InputsCommandService,
  createDependencies: (c: any) => c.inputs.commandsPort,
  extractParams: (path: any, body: any) => ({
    envelopeId: path.envelopeId,
    items: body.items}),
  responseType: "ok",
  includeActor: true});

