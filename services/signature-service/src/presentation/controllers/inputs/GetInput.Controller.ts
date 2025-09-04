/**
 * @file GetInput.Controller.ts
 * @summary Get Input controller
 * @description Handles retrieval of a single Input by ID
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { DefaultInputsQueryService } from "../../../app/services/Inputs";
import { GetInputQuery, EnvelopeInputPath } from "../../../presentation/schemas/inputs";
import type { GetInputQuery as GetInputQueryType } from "../../../app/ports/inputs/InputsQueriesPort";
import type { ListInputsResult } from "../../../app/ports/inputs/InputsQueriesPort";
import type { GetInputQueryControllerInput } from "./types";

/**
 * @description Get Input controller
 */
export const GetInputController = createQueryController<GetInputQueryControllerInput, ListInputsResult["items"][number] | null>({
  querySchema: GetInputQuery,
  pathSchema: EnvelopeInputPath,
  appServiceClass: DefaultInputsQueryService,
  createDependencies: (c) => c.inputs.queriesPort,
  extractParams: (path) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    inputId: path.inputId,
  }),
  responseType: "ok"
});
