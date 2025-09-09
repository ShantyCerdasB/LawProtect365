/**
 * @file ListGlobalParties.Controller.ts
 * @summary List Global Parties controller
 * @description Handles listing of Global Parties with optional filters
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { makeGlobalPartiesQueriesPort } from "../../../app/adapters/global-parties/MakeGlobalPartiesQueriesPort";
import { GlobalPartiesQueryService } from "../../../app/services/GlobalParties";
import { ListGlobalPartiesQuery } from "../../../presentation/schemas/global-parties/ListGlobalParties.schema";
import type { ListGlobalPartiesControllerInput } from "../../../domain/types/global-parties/ControllerInputs";
import type { ListGlobalPartiesAppResult } from "../../../domain/types/global-parties/AppServiceInputs";

/**
 * @description List Global Parties controller
 */
export const ListGlobalPartiesController = createQueryController<ListGlobalPartiesControllerInput, ListGlobalPartiesAppResult>({
  querySchema: ListGlobalPartiesQuery,
  appServiceClass: GlobalPartiesQueryService,
  createDependencies: (c: any) => makeGlobalPartiesQueriesPort({
    globalParties: c.repos.globalParties,
  }),
  extractParams: (_: any, query: any) => ({
    limit: query.limit,
    cursor: query.cursor,
    status: query.status,
    role: query.role,
    source: query.source,
    email: query.email,
  }),
  responseType: "ok"
});








