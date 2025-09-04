/**
 * @file ListInputs.Controller.ts
 * @summary List Inputs controller
 * @description Handles listing of Inputs in envelopes with optional filters
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { DefaultInputsQueryService } from "../../../app/services/Inputs";
import { ListInputsQuery, EnvelopePath } from "../../../presentation/schemas/inputs";
import type { ListInputsQuery as ListInputsQueryType, ListInputsResult } from "../../../app/ports/inputs/InputsQueriesPort";

/**
 * @description List Inputs controller
 */
export const ListInputsController = createQueryController<ListInputsQueryType, ListInputsResult>({
  querySchema: ListInputsQuery,
  pathSchema: EnvelopePath,
  appServiceClass: DefaultInputsQueryService,
  createDependencies: (c) => c.inputs.queriesPort,
  extractParams: (path, query) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    limit: query.limit,
    cursor: query.cursor,
    documentId: query.documentId,
    partyId: query.partyId,
    type: query.type,
    required: query.required,
  }),
  responseType: "ok"
});
