/**
 * @file SearchPartiesByEmail.Controller.ts
 * @summary Search Parties by Email controller
 * @description Handles searching of Parties by email address in an envelope
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { PartiesQueryService } from "../../../app/services/Parties";
import { SearchPartiesByEmailParams, SearchPartiesByEmailQuery } from "../../../presentation/schemas/parties/SearchPartiesByEmail.schema";
import type { SearchPartiesByEmailAppInput, SearchPartiesByEmailAppResult } from "../../../domain/types/parties/AppServiceInputs";

/**
 * @description Search Parties by Email controller
 */
export const SearchPartiesByEmailController = createQueryController<SearchPartiesByEmailAppInput, SearchPartiesByEmailAppResult>({
  pathSchema: SearchPartiesByEmailParams,
  querySchema: SearchPartiesByEmailQuery,
  appServiceClass: PartiesQueryService,
  createDependencies: (c: any) => c.parties.queriesPort,
  extractParams: (path: any, query: any) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    email: query.email,
  }),
  responseType: "ok"
});








