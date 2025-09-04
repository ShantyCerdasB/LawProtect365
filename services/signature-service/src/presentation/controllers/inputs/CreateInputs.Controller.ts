/**
 * @file CreateInputs.Controller.ts
 * @summary Create Inputs controller
 * @description Handles creation of new Inputs in envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { DefaultInputsCommandService } from "../../../app/services/Inputs";
import { CreateInputsBody, EnvelopeInputPath } from "../../../presentation/schemas/inputs";
import type { CreateInputsResult } from "../../../app/ports/inputs/InputsCommandsPort";
import type { CreateInputsControllerInput } from "./types";

/**
 * @description Create Inputs controller
 */
export const CreateInputsController = createCommandController<CreateInputsControllerInput, CreateInputsResult>({
  bodySchema: CreateInputsBody,
  pathSchema: EnvelopeInputPath,
  appServiceClass: DefaultInputsCommandService,
  createDependencies: (c) => c.inputs.commandsPort,
  extractParams: (path, body) => ({
    envelopeId: path.envelopeId,
    documentId: body.documentId,
    inputs: body.inputs,
  }),
  responseType: "created",
  includeActor: true,
});
