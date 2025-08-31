/**
 * @file GetAuditEvent.schema.ts
 * @summary Zod schema for audit event query validation
 * @description Defines validation rules for GET /audit/events/:eventId endpoint
 */

import { z } from "zod";
import { AuditEventIdValidationSchema } from "../../../shared/validations/schemas/audit";

/**
 * @description Path parameters for getting audit event
 */
export const GetAuditEventPathSchema = z.object({
  /** Audit event identifier */
  eventId: AuditEventIdValidationSchema,
});

/**
 * @description Type for path parameters
 */
export type GetAuditEventPath = z.infer<typeof GetAuditEventPathSchema>;

