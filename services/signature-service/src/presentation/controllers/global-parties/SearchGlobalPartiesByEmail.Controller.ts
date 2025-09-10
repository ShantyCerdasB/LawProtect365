/**
 * @file SearchGlobalPartiesByEmail.Controller.ts
 * @summary Search Global Parties by Email controller
 * @description Handles searching of Global Parties by email address
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { makeGlobalPartiesQueriesPort } from "../../../app/adapters/global-parties/MakeGlobalPartiesQueriesPort";
import { GlobalPartiesQueryService } from "../../../app/services/GlobalParties";
import { SearchGlobalPartiesByEmailQuery } from "../../../presentation/schemas/global-parties/SearchGlobalPartiesByEmail.schema";
import type { SearchGlobalPartiesByEmailControllerInput } from "../../../domain/types/global-parties/ControllerInputs";
import type { SearchGlobalPartiesByEmailAppResult } from "../../../domain/types/global-parties/AppServiceInputs";

/**
 * @description Search Global Parties by Email controller
 */
export const SearchGlobalPartiesByEmailController = createQueryController<SearchGlobalPartiesByEmailControllerInput, SearchGlobalPartiesByEmailAppResult>({
  querySchema: SearchGlobalPartiesByEmailQuery,
  appServiceClass: GlobalPartiesQueryService,
  createDependencies: (c: any) => makeGlobalPartiesQueriesPort({
    globalParties: c.repos.globalParties}),
  extractParams: (_: any, query: any) => ({
    email: query.email,
    limit: query.limit}),
  responseType: "ok"
});

