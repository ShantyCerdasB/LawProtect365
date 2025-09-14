/**
 * @fileoverview DynamoDB query types - Common query and pagination types
 * @summary Shared types for DynamoDB queries, pagination, and result structures
 * @description Defines common interfaces for query parameters, pagination cursors,
 * and result structures that can be reused across different entity repositories.
 */

/**
 * Base query parameters for listing entities
 * Common parameters used across all entity listing operations.
 */
export interface BaseListParams {
  /** Maximum number of items to return */
  readonly limit: number;
  /** Pagination cursor for next page */
  readonly cursor?: string;
}

/**
 * Base query result for listing entities
 * Common result structure for all entity listing operations.
 */
export interface BaseListResult<T> {
  /** Array of entities returned */
  readonly items: T[];
  /** Pagination cursor for next page */
  readonly nextCursor?: string;
  /** Total count of items (optional, expensive to calculate) */
  readonly totalCount?: number;
}

/**
 * Base count result for entity queries
 * Common result structure for counting entities.
 */
export interface BaseCountResult {
  /** Number of items counted */
  readonly count: number;
}

/**
 * Date range query parameters
 * Parameters for queries that filter by date ranges.
 */
export interface DateRangeParams {
  /** Start date for the range */
  readonly startDate: Date;
  /** End date for the range */
  readonly endDate: Date;
}

/**
 * Owner-based query parameters
 * Parameters for queries that filter by owner.
 */
export interface OwnerQueryParams {
  /** Owner identifier */
  readonly ownerId: string;
}

/**
 * Status-based query parameters
 * Parameters for queries that filter by status.
 */
export interface StatusQueryParams<T = string> {
  /** Status to filter by */
  readonly status: T;
}

/**
 * Combined query parameters for complex queries
 * Combines multiple query parameter types for complex filtering.
 */
export interface ComplexQueryParams<T = string> extends BaseListParams, Partial<OwnerQueryParams>, Partial<StatusQueryParams<T>>, Partial<DateRangeParams> {}

/**
 * Generic cursor payload for pagination
 * Base structure for pagination cursors that can be extended by specific entities.
 */
export interface BaseCursorPayload {
  /** Timestamp for sorting */
  readonly createdAt: string;
  /** Entity identifier for uniqueness */
  readonly id: string;
  /** Index signature for JSON compatibility */
  readonly [key: string]: string;
}

/**
 * Query options for DynamoDB operations
 * Additional options that can be passed to DynamoDB queries.
 */
export interface QueryOptions {
  /** Whether to use consistent read */
  readonly consistentRead?: boolean;
  /** Whether to return only the count */
  readonly countOnly?: boolean;
  /** Custom filter expression */
  readonly filterExpression?: string;
  /** Expression attribute names for filter */
  readonly filterAttributeNames?: Record<string, string>;
  /** Expression attribute values for filter */
  readonly filterAttributeValues?: Record<string, unknown>;
}

/**
 * DynamoDB sort order for queries
 * Defines the sort order for DynamoDB query results.
 */
export enum DdbSortOrder {
  /** Ascending order */
  ASC = 'ASC',
  /** Descending order */
  DESC = 'DESC'
}

/**
 * Sort parameters for queries
 * Parameters that define how query results should be sorted.
 */
export interface SortParams {
  /** Field to sort by */
  readonly sortBy: string;
  /** Sort order */
  readonly sortOrder: DdbSortOrder;
}
