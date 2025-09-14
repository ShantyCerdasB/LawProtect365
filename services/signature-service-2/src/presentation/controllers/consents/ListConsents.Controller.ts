/**
 * @file ListConsents.Controller.ts
 * @summary Controller for listing consents using standard factory pattern
 * @description Handles GET /envelopes/:envelopeId/consents requests using the standard
 * query controller factory with built-in rate limiting and caching.
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { makeConsentQueryPort } from "../../../app/adapters/consent/MakeConsentQueryPort";
import { ConsentQueryService } from "../../../app/services/Consent/ConsentQueryService";
import type { ListConsentsControllerInput } from "../../../domain/types/consent/ControllerInputs";
import type { ListConsentsAppResult } from "../../../domain/types/consent/AppServiceInputs";
import { ListConsentsPath, ListConsentsQuery } from "../../schemas/consents/ListConsents.schema";

export const handler = createQueryController<ListConsentsControllerInput, ListConsentsAppResult>({
  pathSchema: ListConsentsPath,
  querySchema: ListConsentsQuery,
  appServiceClass: ConsentQueryService,
  createDependencies: (c: any) => makeConsentQueryPort(c.repos.consents),
  extractParams: (path: any, query: any) => ({
    envelopeId: path.envelopeId,
    limit: query.limit,
    cursor: query.cursor,
    status: query.status,
    type: query.consentType,
    partyId: query.partyId}),
  responseType: "ok"
});

