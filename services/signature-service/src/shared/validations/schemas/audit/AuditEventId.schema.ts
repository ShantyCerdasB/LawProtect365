/**
 * @file AuditEventId.schema.ts
 * @summary Audit event ID validation schema
 * @description Zod schema for validating audit event ID branded type
 */

import { AuditEventIdSchema } from "../../../../domain/value-objects/Audit";

/**
 * @summary Audit event ID validation schema
 * @description Validates and transforms string to AuditEventId branded type
 */
export const AuditEventIdValidationSchema = AuditEventIdSchema;

/**
 * @summary Optional audit event ID validation schema
 * @description Validates optional audit event ID
 */
export const OptionalAuditEventIdValidationSchema = AuditEventIdSchema.optional();
