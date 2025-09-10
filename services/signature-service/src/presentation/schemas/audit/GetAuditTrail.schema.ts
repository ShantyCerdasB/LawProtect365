/**
 * @file GetAuditTrail.schema.ts
 * @summary Zod schema for audit trail query validation
 * @description Defines validation rules for GET /envelopes/:id/audit endpoint
 */

import { z } from "zod";
import { EnvelopeIdValidationSchema } from "@/domain/value-objects/ids";
import { OptionalPaginationCursorValidationSchema, OptionalUploadFormatValidationSchema } from "@/domain/value-objects/common";

/**
 * @description Query parameters for getting audit trail
 */
export const GetAuditTrailQuerySchema = z.object({
  /** Output format */
  format: OptionalUploadFormatValidationSchema,
  /** Locale for PDF generation */
  locale: z.string().optional(),
  /** Page size limit */
  limit: z.coerce.number().int().min(1).max(100).optional(),
  /** Pagination cursor */
  cursor: OptionalPaginationCursorValidationSchema});

/**
 * @description Path parameters for getting audit trail
 */
export const GetAuditTrailPathSchema = z.object({
  /** Envelope identifier */
  id: EnvelopeIdValidationSchema});

/**
 * @description Type for query parameters
 */
export type GetAuditTrailQuery = z.infer<typeof GetAuditTrailQuerySchema>;

/**
 * @description Type for path parameters
 */
export type GetAuditTrailPath = z.infer<typeof GetAuditTrailPathSchema>;

