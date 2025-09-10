/**
 * @file CreateInputs.Controller.ts
 * @summary Create Inputs controller
 * @description Handles creation of new Inputs in envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { InputsCommandService } from "../../../app/services/Inputs";
import { CreateInputsBody, EnvelopePath } from "../../../presentation/schemas/inputs";
import type { CreateInputsResult } from "../../../app/ports/inputs/InputsCommandsPort";
import type { CreateInputsControllerInput } from "@/domain/types/inputs";

/**
 * @description Create Inputs controller
 */
export const CreateInputsController = createCommandController<CreateInputsControllerInput, CreateInputsResult>({
  bodySchema: CreateInputsBody,
  pathSchema: EnvelopePath,
  appServiceClass: InputsCommandService,
  createDependencies: (c: any) => c.inputs.commandsPort,
  extractParams: (path: any, body: any) => ({
    envelopeId: path.envelopeId,
    documentId: body.documentId,
    inputs: body.inputs,
  }),
  responseType: "created",
  includeActor: true,
  methodName: "create",
});








