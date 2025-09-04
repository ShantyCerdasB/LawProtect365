/**
 * @file ListParties.Controller.ts
 * @summary List Parties controller
 * @description Handles listing of Parties in envelopes with optional filters
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { DefaultPartiesQueryService } from "../../../app/services/Parties";
import { ListPartiesQuery, ListPartiesParams } from "../../../presentation/schemas/parties/ListParties.schema";
import type { ListPartiesAppInput, ListPartiesAppResult } from "../../../shared/types/parties/AppServiceInputs";

/**
 * @description List Parties controller
 */
export const ListPartiesController = createQueryController<ListPartiesAppInput, ListPartiesAppResult>({
  querySchema: ListPartiesQuery,
  pathSchema: ListPartiesParams,
  appServiceClass: DefaultPartiesQueryService,
  createDependencies: (c) => c.parties.queriesPort,
  extractParams: (path, query) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    role: query.role,
    status: query.status,
    limit: query.limit,
    cursor: query.cursor,
  }),
  responseType: "ok"
});
