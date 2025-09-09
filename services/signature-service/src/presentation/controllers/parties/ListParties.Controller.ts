/**
 * @file ListParties.Controller.ts
 * @summary List Parties controller
 * @description Handles listing of Parties in envelopes with optional filters
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { PartiesQueryService } from "../../../app/services/Parties";
import { ListPartiesQuery, ListPartiesParams } from "../../../presentation/schemas/parties/ListParties.schema";
import type { ListPartiesAppInput, ListPartiesAppResult } from "../../../domain/types/parties/AppServiceInputs";

/**
 * @description List Parties controller
 */
export const ListPartiesController = createQueryController<ListPartiesAppInput, ListPartiesAppResult>({
  querySchema: ListPartiesQuery,
  pathSchema: ListPartiesParams,
  appServiceClass: PartiesQueryService,
  createDependencies: (c: any) => c.parties.queriesPort,
  extractParams: (path: any, query: any) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    role: query.role,
    status: query.status,
    limit: query.limit,
    cursor: query.cursor,
  }),
  responseType: "ok"
});








