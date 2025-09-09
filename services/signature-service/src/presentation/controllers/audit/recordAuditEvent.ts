/**
 * @file recordAuditEvent.ts
 * @summary Controller for recording audit events
 * @description Handles POST requests to record new audit events
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { RecordAuditEventBodySchema } from "../../schemas/audit";
import { RecordAuditEventAppService } from "../../../app/services/Audit/RecordAuditEventApp.service";
import { makeAuditCommandsPort } from "../../../app/adapters/audit/makeAuditCommandsPort";
import { RESPONSE_TYPES } from "../../../domain/values/enums";

/**
 * Lambda handler for POST /audit/events endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with recorded audit event data
 */
export const handler = createCommandController({
  bodySchema: RecordAuditEventBodySchema,
  appServiceClass: RecordAuditEventAppService,
  createDependencies: (container: any) => makeAuditCommandsPort(container.repos.audit),
  extractParams: (_: any, body: any) => ({
    envelopeId: body.envelopeId,
    type: body.type,
    actor: body.actor,
    metadata: body.metadata,
  }),
  responseType: RESPONSE_TYPES[1], // 'created'
  includeActor: true, // Include actor context from JWT
});








