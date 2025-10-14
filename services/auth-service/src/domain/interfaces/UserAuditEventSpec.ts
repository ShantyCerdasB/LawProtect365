/**
 * @fileoverview UserAuditEventSpec interface - Query specification for UserAuditEvent searches
 * @summary Defines search criteria for UserAuditEvent entity queries
 * @description This interface provides search criteria for querying UserAuditEvent entities
 * with support for filtering by user, action, and date ranges.
 */

import { UserAuditAction as PrismaUserAuditAction } from '@prisma/client';

/**
 * Query specification for UserAuditEvent searches
 * 
 * Provides search criteria for UserAuditEvent entity queries,
 * including basic field filters, text search, and date range filtering.
 */
export interface UserAuditEventSpec {
  /** User ID filter */
  userId?: string;
  /** Audit action filter */
  action?: PrismaUserAuditAction;
  /** Description text filter */
  description?: string;
  /** Actor ID filter */
  actorId?: string;
  /** IP address filter */
  ipAddress?: string;
  /** User agent filter */
  userAgent?: string;
  /** Created before date filter */
  createdBefore?: Date;
  /** Created after date filter */
  createdAfter?: Date;
}
