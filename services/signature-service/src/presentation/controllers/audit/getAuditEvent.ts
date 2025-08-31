/**
 * @file getAuditEvent.ts
 * @summary Controller for retrieving a specific audit event
 * @description Handles GET requests to retrieve audit event details by event ID
 */

import { createHandler, createQueryController } from "@/shared/controllers";
import { GetAuditEventPathSchema } from "@/presentation/schemas/audit";
import { GetAuditEventAppService } from "@/app/services/Audit/GetAuditEventApp.service";
import { makeAuditQueriesPort } from "@/app/adapters/audit/makeAuditQueriesPort";
import { RESPONSE_TYPES } from "@/domain/values/enums";

/**
 * Lambda handler for GET /audit/events/{eventId} endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with audit event data
 */
export const handler = createHandler(
  createQueryController({
    pathSchema: GetAuditEventPathSchema,
    appServiceClass: GetAuditEventAppService,
    createDependencies: (container) => makeAuditQueriesPort(container.repos.audit),
    extractParams: (path) => ({
      eventId: path.eventId,
    }),
    responseType: RESPONSE_TYPES[0], // 'ok'
  }),
  { auth: true }
);
