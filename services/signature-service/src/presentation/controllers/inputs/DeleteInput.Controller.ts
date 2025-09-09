/**
 * @file DeleteInput.Controller.ts
 * @summary Delete Input controller
 * @description Handles deletion of Inputs
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { InputsCommandService } from "../../../app/services/Inputs";
import { EnvelopeInputPath } from "../../../presentation/schemas/inputs";
import type { DeleteInputControllerInput } from "@/domain/types/inputs";

/**
 * @description Delete Input controller
 */
export const DeleteInputController = createCommandController<DeleteInputControllerInput, void>({
  pathSchema: EnvelopeInputPath,
  appServiceClass: InputsCommandService,
  createDependencies: (c: any) => c.inputs.commandsPort,
  extractParams: (path: any) => ({
    envelopeId: path.envelopeId,
    inputId: path.inputId,
  }),
  responseType: "noContent",
  includeActor: true,
});








