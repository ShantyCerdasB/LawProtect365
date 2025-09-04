/**
 * @file DeleteInput.Controller.ts
 * @summary Delete Input controller
 * @description Handles deletion of Inputs
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { DefaultInputsCommandService } from "../../../app/services/Inputs";
import { EnvelopeInputPath } from "../../../presentation/schemas/inputs";
import type { InputWithIdControllerInput } from "./types";

/**
 * @description Delete Input controller
 */
export const DeleteInputController = createCommandController<InputWithIdControllerInput, void>({
  pathSchema: EnvelopeInputPath,
  appServiceClass: DefaultInputsCommandService,
  createDependencies: (c) => c.inputs.commandsPort,
  extractParams: (path) => ({
    envelopeId: path.envelopeId,
    inputId: path.inputId,
  }),
  responseType: "noContent",
  includeActor: true,
});
