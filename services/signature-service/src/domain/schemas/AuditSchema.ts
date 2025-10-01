/**
 * @fileoverview AuditSchema - Validation schemas for audit event operations
 * @summary Provides comprehensive Zod validation schemas for audit events and audit trail operations
 * @description This module defines validation schemas for audit event data, audit trail queries,
 * and audit event responses. It ensures type safety and data validation for all audit-related
 * operations including event creation, trail queries, and response formatting.
 */

import { z, UuidV4, NonEmptyStringSchema } from '@lawprotect/shared-ts';
import { AuditEventType } from '../enums/AuditEventType';

/**
 * Schema for audit event type validation
 * @description Validates audit event types against the defined enum values
 */
export const AuditEventTypeSchema = z.nativeEnum(AuditEventType);

/**
 * Schema for creating audit events validation
 * @description Validates audit event creation requests with comprehensive field validation
 * including envelope ID, optional signer ID, event type, description, user information,
 * and optional metadata for audit trail compliance.
 */
export const CreateAuditEventSchema = z.object({
  envelopeId: UuidV4,
  signerId: UuidV4.optional(),
  eventType: AuditEventTypeSchema,
  description: NonEmptyStringSchema.max(1000, 'Description must be less than 1000 characters'),
  userId: NonEmptyStringSchema,
  userEmail: z.string().email().optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500, 'User agent must be less than 500 characters').optional(),
  metadata: z.record(z.unknown()).optional()
});

/**
 * Schema for audit event ID path parameters
 */
export const AuditEventIdSchema = z.object({
  auditEventId: UuidV4
});

/**
 * Schema for audit trail query parameters
 */
export const AuditTrailQuerySchema = z.object({
  envelopeId: UuidV4,
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  eventType: AuditEventTypeSchema.optional(),
  userId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional()
});

/**
 * Schema for audit event response
 */
export const AuditEventResponseSchema = z.object({
  id: UuidV4,
  envelopeId: UuidV4,
  signerId: UuidV4.optional(),
  eventType: AuditEventTypeSchema,
  description: z.string(),
  userId: z.string(),
  userEmail: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date()
});

/**
 * Schema for audit trail response
 */
export const AuditTrailResponseSchema = z.object({
  events: z.array(AuditEventResponseSchema),
  nextCursor: z.string().optional(),
  hasMore: z.boolean()
});

/**
 * Type definitions for audit schemas
 */
export type AuditEventIdParams = z.infer<typeof AuditEventIdSchema>;
export type AuditTrailQuery = z.infer<typeof AuditTrailQuerySchema>;
export type AuditEventResponse = z.infer<typeof AuditEventResponseSchema>;
export type AuditTrailResponse = z.infer<typeof AuditTrailResponseSchema>;
