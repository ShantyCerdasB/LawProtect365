/**
 * @fileoverview UserSpec interface - Query specification for User searches
 * @summary Defines search criteria for User entity queries
 * @description This interface provides a comprehensive set of search criteria
 * for querying User entities with support for filtering, text search, and date ranges.
 */

import {  UserRole as PrismaUserRole, UserAccountStatus as PrismaUserAccountStatus } from '@prisma/client';

/**
 * Query specification for User searches
 * 
 * Provides comprehensive search criteria for User entity queries,
 * including basic field filters, text search, and date range filtering.
 */
export interface UserSpec {
  /** Email address filter */
  email?: string;
  /** Cognito subject identifier filter */
  cognitoSub?: string;
  /** User role filter */
  role?: PrismaUserRole;
  /** User account status filter */
  status?: PrismaUserAccountStatus;
  /** MFA enabled status filter */
  mfaEnabled?: boolean;
  /** Created after date filter */
  createdAfter?: Date;
  /** Created before date filter */
  createdBefore?: Date;
  /** Last login after date filter */
  lastLoginAfter?: Date;
  /** Last login before date filter */
  lastLoginBefore?: Date;
  /** Text search in name and email fields */
  search?: string;
}
