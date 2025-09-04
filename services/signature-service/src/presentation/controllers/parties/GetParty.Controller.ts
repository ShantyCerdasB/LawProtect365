/**
 * @file GetParty.Controller.ts
 * @summary Get Party controller
 * @description Handles retrieval of a specific Party by ID from an envelope
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { DefaultPartiesQueryService } from "../../../app/services/Parties";
import { GetPartyParams } from "../../../presentation/schemas/parties/GetParty.schema";
import type { GetPartyAppInput, GetPartyAppResult } from "../../../shared/types/parties/AppServiceInputs";

/**
 * @description Get Party controller
 */
export const GetPartyController = createQueryController<GetPartyAppInput, GetPartyAppResult>({
  pathSchema: GetPartyParams,
  appServiceClass: DefaultPartiesQueryService,
  createDependencies: (c) => c.parties.queriesPort,
  extractParams: (path) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
    partyId: path.partyId,
  }),
  responseType: "ok"
});
