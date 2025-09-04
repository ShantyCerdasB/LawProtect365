/**
 * @file ListEnvelopes.Controller.ts
 * @summary List Envelopes controller
 * @description Handles listing of Envelopes with pagination
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { EnvelopesQueryService } from "../../../app/services/envelopes";
import { ListEnvelopesParams, ListEnvelopesQuery } from "../../../presentation/schemas/envelopes/ListEnvelopes.schema";
import type { ListEnvelopesControllerInput } from "../../../shared/types/envelopes/ControllerInputs";
import type { ListEnvelopesAppResult } from "../../../shared/types/envelopes/AppServiceInputs";

/**
 * @description List Envelopes controller
 */
export const ListEnvelopesController = createQueryController<ListEnvelopesControllerInput, ListEnvelopesAppResult>({
  pathSchema: ListEnvelopesParams,
  querySchema: ListEnvelopesQuery,
  appServiceClass: EnvelopesQueryService,
  createDependencies: (c) => c.envelopes.queriesPort,
  extractParams: (path, query) => ({
    tenantId: path.tenantId,
    limit: query.limit,
    cursor: query.cursor,
  }),
  responseType: "ok"
});
