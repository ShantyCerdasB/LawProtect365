/**
 * @file SearchPartiesByEmail.Controller.ts
 * @summary Search Parties by Email controller
 * @description Handles searching of Parties by email address in an envelope
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { DefaultPartiesQueryService } from "../../../app/services/Parties";
import { SearchPartiesByEmailParams, SearchPartiesByEmailQuery } from "../../../presentation/schemas/parties/SearchPartiesByEmail.schema";
import type { SearchPartiesByEmailAppInput, SearchPartiesByEmailAppResult } from "../../../shared/types/parties/AppServiceInputs";

/**
 * @description Search Parties by Email controller
 */
export const SearchPartiesByEmailController = createQueryController<SearchPartiesByEmailAppInput, SearchPartiesByEmailAppResult>({
  pathSchema: SearchPartiesByEmailParams,
  querySchema: SearchPartiesByEmailQuery,
  appServiceClass: DefaultPartiesQueryService,
  createDependencies: (c) => c.parties.queriesPort,
  extractParams: (path, query) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    email: query.email,
  }),
  responseType: "ok"
});
