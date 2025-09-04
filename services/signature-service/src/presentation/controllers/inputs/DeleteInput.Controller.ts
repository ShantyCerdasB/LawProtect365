/**
 * @file DeleteInput.Controller.ts
 * @summary Delete Input controller
 * @description Handles deletion of Inputs
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { DefaultInputsCommandService } from "../../../app/services/Inputs";
import { EnvelopeInputPath } from "../../../presentation/schemas/inputs";
import type { DeleteInputCommand } from "../../../app/ports/inputs/InputsCommandsPort";

/**
 * @description Delete Input controller
 */
export const DeleteInputController = createCommandController<DeleteInputCommand, void>({
  pathSchema: EnvelopeInputPath,
  appServiceClass: DefaultInputsCommandService,
  createDependencies: (c) => c.inputs.commandsPort,
  extractParams: (path) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    inputId: path.inputId,
  }),
  responseType: "noContent",
  includeActor: true,
});
