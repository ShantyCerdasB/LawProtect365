/**
 * @file SearchGlobalPartiesByEmail.Controller.ts
 * @summary Search Global Parties by Email controller
 * @description Handles searching of Global Parties by email address
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { makeGlobalPartiesQueriesPort } from "../../../app/adapters/global-parties/MakeGlobalPartiesQueriesPort";
import { DefaultGlobalPartiesQueryService } from "../../../app/services/GlobalParties";
import { SearchGlobalPartiesByEmailQuery } from "../../../presentation/schemas/global-parties/SearchGlobalPartiesByEmail.schema";
import type { SearchGlobalPartiesByEmailControllerInput } from "../../../shared/types/global-parties/ControllerInputs";
import type { SearchGlobalPartiesByEmailAppResult } from "../../../shared/types/global-parties/AppServiceInputs";

/**
 * @description Search Global Parties by Email controller
 */
export const SearchGlobalPartiesByEmailController = createQueryController<SearchGlobalPartiesByEmailControllerInput, SearchGlobalPartiesByEmailAppResult>({
  querySchema: SearchGlobalPartiesByEmailQuery,
  appServiceClass: DefaultGlobalPartiesQueryService,
  createDependencies: (c) => makeGlobalPartiesQueriesPort({
    globalParties: c.repos.globalParties,
  }),
  extractParams: (_, query) => ({
    email: query.email,
    limit: query.limit,
  }),
  responseType: "ok"
});
