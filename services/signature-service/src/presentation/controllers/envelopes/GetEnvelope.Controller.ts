/**
 * @file GetEnvelope.Controller.ts
 * @summary Get Envelope controller
 * @description Handles retrieval of a specific Envelope by ID
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { EnvelopesQueryService } from "../../../app/services/envelopes";
import { GetEnvelopeParams } from "../../../presentation/schemas/envelopes/GetEnvelope.schema";
import type { GetEnvelopeControllerInput } from "../../../domain/types/envelopes/ControllerInputs";
import type { GetEnvelopeAppResult } from "../../../domain/types/envelopes/AppServiceInputs";

/**
 * @description Get Envelope controller
 */
export const GetEnvelopeController = createQueryController<GetEnvelopeControllerInput, GetEnvelopeAppResult>({
  pathSchema: GetEnvelopeParams,
  appServiceClass: EnvelopesQueryService,
  createDependencies: (c: any) => c.envelopes.queriesPort,
  extractParams: (path: any) => ({
    envelopeId: path.envelopeId}),
  responseType: "ok"
});

