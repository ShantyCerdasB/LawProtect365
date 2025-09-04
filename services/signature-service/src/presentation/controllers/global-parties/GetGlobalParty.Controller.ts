/**
 * @file GetGlobalParty.Controller.ts
 * @summary Get Global Party controller
 * @description Handles retrieval of a specific Global Party by ID
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { makeGlobalPartiesQueriesPort } from "../../../app/adapters/global-parties/MakeGlobalPartiesQueriesPort";
import { DefaultGlobalPartiesQueryService } from "../../../app/services/GlobalParties";
import { GetGlobalPartyParams } from "../../../presentation/schemas/global-parties/GetGlobalParty.schema";
import type { GetGlobalPartyControllerInput } from "../../../shared/types/global-parties/ControllerInputs";
import type { GetGlobalPartyAppResult } from "../../../shared/types/global-parties/AppServiceInputs";

/**
 * @description Get Global Party controller
 */
export const GetGlobalPartyController = createQueryController<GetGlobalPartyControllerInput, GetGlobalPartyAppResult>({
  pathSchema: GetGlobalPartyParams,
  appServiceClass: DefaultGlobalPartiesQueryService,
  createDependencies: (c) => makeGlobalPartiesQueriesPort({
    globalParties: c.repos.globalParties,
  }),
  extractParams: (path) => ({
    partyId: path.globalPartyId,
  }),
  responseType: "ok"
});
