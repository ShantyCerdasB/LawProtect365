/**
 * @file RecordAuditEvent.schema.ts
 * @summary Zod schema for audit event recording validation
 * @description Defines validation rules for POST /audit/events endpoint
 */

import { z } from "zod";
import { EnvelopeIdValidationSchema } from "../../../shared/validations/schemas/common";
import { AuditEventTypeValidationSchema } from "../../../shared/validations/schemas/audit";


/**
 * @description Body schema for recording audit event
 */
export const RecordAuditEventBodySchema = z.object({
  /** Envelope identifier */
  envelopeId: EnvelopeIdValidationSchema,
  /** Event type */
  type: AuditEventTypeValidationSchema,
  /** Actor information (optional) */
  actor: z.object({
    /** User identifier */
    userId: z.string().optional(),
    /** User email */
    email: z.string().email().optional(),
    /** User role */
    role: z.string().optional(),
  }).optional(),
  /** Event metadata (optional) */
  metadata: z.record(z.unknown()).optional(),
});

/**
 * @description Type for body parameters
 */
export type RecordAuditEventBody = z.infer<typeof RecordAuditEventBodySchema>;
