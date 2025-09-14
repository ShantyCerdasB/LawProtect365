/**
 * @file Pagination.ts
 * @summary Standard pagination types for domain contracts
 * @description Defines standardized pagination interfaces and types used across
 * all repository contracts to ensure consistency in pagination patterns.
 * 
 * This module provides common pagination types that should be used consistently
 * across all repository interfaces to maintain type safety and consistency.
 */

import type { PaginationCursor } from "@/domain/value-objects";

/**
 * @summary Standard paginated result interface
 * @description Provides a consistent structure for paginated results across all repositories
 */
export interface PaginatedResult<T> {
  /** Array of items in the current page */
  readonly items: T[];
  /** Cursor for the next page, undefined if no more pages */
  readonly nextCursor?: PaginationCursor;
  /** Indicates if there are more pages available */
  readonly hasMore: boolean;
  /** Total count of items (optional, may not be available in all queries) */
  readonly totalCount?: number;
}

/**
 * @summary Standard list parameters interface
 * @description Provides consistent parameters for list operations across repositories
 */
export interface ListParams {
  /** Maximum number of items to return (required, validated 1-100) */
  readonly limit: number;
  /** Cursor for pagination (optional) */
  readonly cursor?: PaginationCursor;
}

/**
 * @summary Standard list parameters with optional limit
 * @description For repositories that support optional limit parameters
 */
export interface ListParamsOptional {
  /** Maximum number of items to return (optional, defaults to 20) */
  readonly limit?: number;
  /** Cursor for pagination (optional) */
  readonly cursor?: PaginationCursor;
}

/**
 * @summary Repository operation limits
 * @description Standard limits for repository operations
 */
export const REPOSITORY_LIMITS = {
  /** Maximum page size allowed */
  MAX_PAGE_SIZE: 100,
  /** Default page size when not specified */
  DEFAULT_PAGE_SIZE: 20,
  /** Minimum page size allowed */
  MIN_PAGE_SIZE: 1,
  /** Maximum items per batch operation */
  MAX_BATCH_SIZE: 25} as const;

/**
 * @summary Validates pagination parameters
 * @description Utility function to validate pagination parameters
 */
export function validatePaginationParams(params: { limit?: number }): number {
  const limit = params.limit ?? REPOSITORY_LIMITS.DEFAULT_PAGE_SIZE;
  
  if (limit < REPOSITORY_LIMITS.MIN_PAGE_SIZE) {
    throw new Error(`Limit must be at least ${REPOSITORY_LIMITS.MIN_PAGE_SIZE}`);
  }
  
  if (limit > REPOSITORY_LIMITS.MAX_PAGE_SIZE) {
    throw new Error(`Limit cannot exceed ${REPOSITORY_LIMITS.MAX_PAGE_SIZE}`);
  }
  
  return limit;
}
