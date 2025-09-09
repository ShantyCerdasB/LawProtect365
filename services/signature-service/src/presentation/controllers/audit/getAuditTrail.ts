/**
 * @file getAuditTrail.ts
 * @summary Controller for getting audit trail
 * @description Handles GET requests to retrieve audit trail for an envelope
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { GetAuditTrailPathSchema, GetAuditTrailQuerySchema } from "../../schemas/audit";
import { GetAuditTrailAppService } from "../../../app/services/Audit/GetAuditTrailApp.service";
import { makeAuditQueriesPort } from "../../../app/adapters/audit/makeAuditQueriesPort";
import { RESPONSE_TYPES } from "../../../domain/values/enums";

/**
 * Lambda handler for GET /envelopes/:id/audit endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with audit trail data
 */
export const handler = createQueryController({
  pathSchema: GetAuditTrailPathSchema,
  querySchema: GetAuditTrailQuerySchema,
  appServiceClass: GetAuditTrailAppService,
  createDependencies: (container: any) => makeAuditQueriesPort(container.repos.audit),
  extractParams: (path: any, query: any) => ({
    envelopeId: path.id,
    format: query.format,
    locale: query.locale,
    limit: query.limit,
    cursor: query.cursor,
  }),
  responseType: RESPONSE_TYPES[0], // 'ok'
});








