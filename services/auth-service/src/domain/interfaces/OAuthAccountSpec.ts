/**
 * @fileoverview OAuthAccountSpec interface - Query specification for OAuthAccount searches
 * @summary Defines search criteria for OAuthAccount entity queries
 * @description This interface provides search criteria for querying OAuthAccount entities
 * with support for filtering by user, provider, and date ranges.
 */

import { OAuthProvider as PrismaOAuthProvider } from '@prisma/client';

/**
 * Query specification for OAuthAccount searches
 * 
 * Provides search criteria for OAuthAccount entity queries,
 * including basic field filters and date range filtering.
 */
export interface OAuthAccountSpec {
  /** User ID filter */
  userId?: string;
  /** OAuth provider filter */
  provider?: PrismaOAuthProvider;
  /** Provider account ID filter */
  providerAccountId?: string;
  /** Created after date filter */
  createdAfter?: Date;
  /** Created before date filter */
  createdBefore?: Date;
}
