/**
 * @fileoverview AuditSchema - Zod schemas for audit event validation
 * @summary Validation schemas for audit trail events and queries
 * @description The AuditSchema provides Zod validation schemas for audit-related
 * operations including event creation, queries, and filtering.
 */

import { z, UuidV4, EmailStringSchema, JsonObjectSchema, NonEmptyStringSchema } from '@lawprotect/shared-ts';
import { AuditEventType, AuditSortBy, SortOrder } from '@/domain/enums';

/**
 * Schema for audit event types
 */
export const AuditEventTypeSchema = z.nativeEnum(AuditEventType);

/**
 * Schema for creating an audit event
 */
export const CreateAuditEventSchema = z.object({
  type: AuditEventTypeSchema,
  envelopeId: UuidV4,
  signerId: UuidV4.optional(),
  signatureId: UuidV4.optional(),
  userId: z.string().optional(),
  userEmail: EmailStringSchema.optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  metadata: JsonObjectSchema.optional(),
  description: NonEmptyStringSchema.max(1000, 'Description must be less than 1000 characters')
});

/**
 * Schema for audit event ID parameter
 */
export const AuditEventIdSchema = z.object({
  eventId: UuidV4
});

/**
 * Schema for document history path parameters
 */
export const DocumentHistoryPathSchema = z.object({
  envelopeId: UuidV4
});

/**
 * Schema for document history query parameters
 */
export const DocumentHistoryQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(25),
  cursor: z.string().optional()
});

/**
 * Schema for audit trail query parameters
 */
export const AuditTrailQuerySchema = z.object({
  envelopeId: UuidV4.optional(),
  signerId: UuidV4.optional(),
  signatureId: UuidV4.optional(),
  userId: z.string().optional(),
  userEmail: EmailStringSchema.optional(),
  type: AuditEventTypeSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  sortBy: z.nativeEnum(AuditSortBy).default(AuditSortBy.TIMESTAMP),
  sortOrder: z.nativeEnum(SortOrder).default(SortOrder.DESC)
});

/**
 * Schema for audit event response
 */
export const AuditEventResponseSchema = z.object({
  id: UuidV4,
  type: AuditEventTypeSchema,
  envelopeId: UuidV4,
  signerId: UuidV4.optional(),
  signatureId: UuidV4.optional(),
  userId: z.string().optional(),
  userEmail: EmailStringSchema.optional(),
  timestamp: z.date(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  metadata: JsonObjectSchema.optional(),
  description: z.string()
});

/**
 * Schema for audit trail response
 */
export const AuditTrailResponseSchema = z.object({
  events: z.array(AuditEventResponseSchema),
  total: z.number().min(0),
  limit: z.number().min(1),
  offset: z.number().min(0),
  hasMore: z.boolean()
});

/**
 * Type inference from schemas
 */
export type CreateAuditEventRequest = z.infer<typeof CreateAuditEventSchema>;
export type AuditEventIdParams = z.infer<typeof AuditEventIdSchema>;
export type DocumentHistoryPathParams = z.infer<typeof DocumentHistoryPathSchema>;
export type DocumentHistoryQuery = z.infer<typeof DocumentHistoryQuerySchema>;
export type AuditTrailQuery = z.infer<typeof AuditTrailQuerySchema>;
export type AuditEventResponse = z.infer<typeof AuditEventResponseSchema>;
export type AuditTrailResponse = z.infer<typeof AuditTrailResponseSchema>;
