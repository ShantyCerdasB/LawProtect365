/**
 * @file UpdateInput.Controller.ts
 * @summary Update Input controller
 * @description Handles updating of existing Inputs
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { DefaultInputsCommandService } from "../../../app/services/Inputs";
import { PatchInputBody, EnvelopeInputPath } from "../../../presentation/schemas/inputs";
import type { UpdateInputResult } from "../../../app/ports/inputs/InputsCommandsPort";
import type { UpdateInputControllerInput } from "./types";

/**
 * @description Update Input controller
 */
export const UpdateInputController = createCommandController<UpdateInputControllerInput, UpdateInputResult>({
  bodySchema: PatchInputBody,
  pathSchema: EnvelopeInputPath,
  appServiceClass: DefaultInputsCommandService,
  createDependencies: (c) => c.inputs.commandsPort,
  extractParams: (path, body) => ({
    envelopeId: path.envelopeId,
    inputId: path.inputId,
    updates: body,
  }),
  responseType: "ok",
  includeActor: true,
});
