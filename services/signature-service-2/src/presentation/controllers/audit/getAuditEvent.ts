/**
 * @file getAuditEvent.ts
 * @summary Controller for getting audit event
 * @description Handles GET requests to retrieve a specific audit event
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { GetAuditEventPathSchema } from "../../schemas/audit";
import { GetAuditEventAppService } from "../../../app/services/Audit/GetAuditEventApp.service";
import { makeAuditQueriesPort } from "../../../app/adapters/audit/makeAuditQueriesPort";
import { RESPONSE_TYPES } from "../../../domain/values/enums";

/**
 * Lambda handler for GET /audit/events/:id endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with audit event data
 */
export const handler = createQueryController({
  pathSchema: GetAuditEventPathSchema,
  appServiceClass: GetAuditEventAppService,
  createDependencies: (container: any) => makeAuditQueriesPort(container.repos.audit),
  extractParams: (path: any) => ({
    eventId: path.id}),
  responseType: RESPONSE_TYPES[0], // 'ok'
});

