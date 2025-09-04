/**
 * @file GetEnvelope.Controller.ts
 * @summary Get Envelope controller
 * @description Handles retrieval of a specific Envelope by ID
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { GetEnvelopeApp } from "../../../app/services/envelopes";
import { GetEnvelopeParams } from "../../../presentation/schemas/envelopes/GetEnvelope.schema";
import type { GetEnvelopeControllerInput } from "../../../shared/types/envelopes/ControllerInputs";
import type { GetEnvelopeAppResult } from "../../../shared/types/envelopes/AppServiceInputs";

/**
 * @description Get Envelope controller
 */
export const GetEnvelopeController = createQueryController<GetEnvelopeControllerInput, GetEnvelopeAppResult>({
  pathSchema: GetEnvelopeParams,
  appServiceClass: GetEnvelopeApp,
  createDependencies: (c) => ({
    envelopesQueries: c.envelopes.queriesPort,
  }),
  extractParams: (path) => ({
    tenantId: path.tenantId,
    envelopeId: path.envelopeId,
  }),
  responseType: "ok"
});
