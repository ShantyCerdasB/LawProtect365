/**
 * @file GetInput.Controller.ts
 * @summary Get Input controller
 * @description Handles retrieval of a single Input by ID
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { InputsQueryService } from "../../../app/services/Inputs";
import { GetInputQuery, EnvelopeInputPath } from "../../../presentation/schemas/inputs";
import type { ListInputsResult } from "../../../app/ports/inputs/InputsQueriesPort";
import type { GetInputQueryControllerInput } from "@/domain/types/inputs";

/**
 * @description Get Input controller
 */
export const GetInputController = createQueryController<GetInputQueryControllerInput, ListInputsResult["items"][number] | null>({
  querySchema: GetInputQuery,
  pathSchema: EnvelopeInputPath,
  appServiceClass: InputsQueryService,
  createDependencies: (c: any) => c.inputs.queriesPort,
  extractParams: (path: any) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    inputId: path.inputId,
  }),
  responseType: "ok"
});








