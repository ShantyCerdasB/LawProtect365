/**
 * @file getAuditTrail.ts
 * @summary Controller for retrieving audit trail for an envelope
 * @description Handles GET requests to retrieve audit trail for a specific envelope
 */

import { createHandler, createQueryController } from "@/shared/controllers";
import { GetAuditTrailPathSchema, GetAuditTrailQuerySchema } from "@/presentation/schemas/audit";
import { GetAuditTrailAppService } from "@/app/services/Audit/GetAuditTrailApp.service";
import { makeAuditQueriesPort } from "@/app/adapters/audit/makeAuditQueriesPort";
import { RESPONSE_TYPES } from "@/domain/values/enums";

/**
 * Lambda handler for GET /audit/trail/{envelopeId} endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with audit trail data
 */
export const handler = createHandler(
  createQueryController({
    pathSchema: GetAuditTrailPathSchema,
    querySchema: GetAuditTrailQuerySchema,
    appServiceClass: GetAuditTrailAppService,
    createDependencies: (container) => makeAuditQueriesPort(container.repos.audit),
    extractParams: (path, query) => ({
      envelopeId: path.envelopeId,
      limit: query?.limit,
      cursor: query?.cursor,
      format: query?.format,
      locale: query?.locale,
    }),
    transformResult: (result) => ({
      entries: result.entries,
      meta: { nextCursor: result.nextCursor },
    }),
    responseType: RESPONSE_TYPES[0], // 'ok'
  }),
  { auth: true }
);
