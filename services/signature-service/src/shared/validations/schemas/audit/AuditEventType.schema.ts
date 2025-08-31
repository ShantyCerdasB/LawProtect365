/**
 * @file AuditEventType.schema.ts
 * @summary Audit event type validation schema
 * @description Zod schema for validating audit event types using domain enums
 */

import { z } from "zod";
import { AUDIT_EVENT_TYPES } from "../../../../domain/values/enums";

/**
 * @summary Audit event type validation schema
 * @description Validates audit event type using domain enum values
 */
export const AuditEventTypeValidationSchema = z.enum(AUDIT_EVENT_TYPES);

/**
 * @summary Optional audit event type validation schema
 * @description Validates optional audit event type
 */
export const OptionalAuditEventTypeValidationSchema = AuditEventTypeValidationSchema.optional();
