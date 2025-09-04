/**
 * @file GetEnvelopeStatus.Controller.ts
 * @summary Get Envelope Status controller
 * @description Handles retrieval of Envelope status
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { EnvelopesQueryService } from "../../../app/services/envelopes";
import { GetEnvelopeStatusParams } from "../../../presentation/schemas/envelopes/GetEnvelopeStatus.schema";
import type { GetEnvelopeStatusControllerInput } from "../../../shared/types/envelopes/ControllerInputs";
import type { GetEnvelopeStatusAppResult } from "../../../shared/types/envelopes/AppServiceInputs";

/**
 * @description Get Envelope Status controller
 */
export const GetEnvelopeStatusController = createQueryController<GetEnvelopeStatusControllerInput, GetEnvelopeStatusAppResult>({
  pathSchema: GetEnvelopeStatusParams,
  appServiceClass: EnvelopesQueryService,
  createDependencies: (c) => c.envelopes.queriesPort,
  extractParams: (path) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
  }),
  responseType: "ok"
});
