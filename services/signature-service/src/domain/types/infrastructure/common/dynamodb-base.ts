/**
 * @fileoverview DynamoDB base types - Common types for all DynamoDB operations
 * @summary Base interfaces and types shared across all DynamoDB repositories
 * @description Defines common DynamoDB item structures, query parameters, and result types
 * that can be reused across different entity repositories.
 */

import type { DdbClientLike } from '@lawprotect/shared-ts';

/**
 * Common DynamoDB item structure
 * Base interface for all DynamoDB items with required partition key, sort key, and type fields.
 */
export interface DdbItem {
  /** Partition key */
  readonly pk: string;
  /** Sort key */
  readonly sk: string;
  /** Item type for single-table design */
  readonly type: string;
  /** Additional properties */
  readonly [key: string]: unknown;
}

/**
 * DynamoDB item with TTL support
 * Extends DdbItem to include time-to-live functionality for automatic item expiration.
 */
export interface DdbItemWithTTL extends DdbItem {
  /** Time-to-live timestamp */
  readonly ttl?: number;
}

/**
 * DynamoDB item with versioning support
 * Extends DdbItem to include version control for optimistic locking and conflict resolution.
 */
export interface DdbItemWithVersion extends DdbItem {
  /** Item version for optimistic locking */
  readonly version: number;
  /** Last update timestamp */
  readonly updatedAt: string;
}

/**
 * DynamoDB item with audit fields
 * Extends DdbItem to include audit trail information for tracking creation and modification.
 */
export interface DdbItemWithAudit extends DdbItem {
  /** Creation timestamp */
  readonly createdAt: string;
  /** Last update timestamp */
  readonly updatedAt: string;
  /** User who created the item */
  readonly createdBy?: string;
  /** User who last updated the item */
  readonly updatedBy?: string;
}

/**
 * Complete DynamoDB item with all common fields
 * Combines all common DynamoDB item interfaces for comprehensive item structure.
 */
export interface DdbItemComplete extends DdbItemWithTTL, DdbItemWithVersion, DdbItemWithAudit {}

/**
 * DynamoDB client with query support
 * Extends the base DdbClientLike interface to include the query operation required for repository implementations.
 */
export interface DdbClientWithQuery extends DdbClientLike {
  /**
   * Execute a DynamoDB query operation
   * @param params - Query parameters
   * @returns Promise resolving to query result
   */
  query(params: DdbQueryParams): Promise<DdbQueryResult>;
}

/**
 * DynamoDB client with update support
 * Extends the base DdbClientLike interface to include the update operation required for repository implementations.
 */
export interface DdbClientWithUpdate extends DdbClientLike {
  /**
   * Execute a DynamoDB update operation
   * @param params - Update parameters
   * @returns Promise resolving to update result
   */
  update(params: any): Promise<any>;
}

/**
 * Minimal shape of the query operation required (SDK-agnostic)
 * Defines the structure for DynamoDB query parameters.
 * Used by repositories to perform queries on DynamoDB tables and indexes.
 */
export interface DdbQueryParams {
  /** DynamoDB table name */
  readonly TableName: string;
  /** Global Secondary Index name (optional) */
  readonly IndexName?: string;
  /** Key condition expression for the query */
  readonly KeyConditionExpression: string;
  /** Expression attribute names (optional) */
  readonly ExpressionAttributeNames?: Record<string, string>;
  /** Expression attribute values (optional) */
  readonly ExpressionAttributeValues?: Record<string, unknown>;
  /** Maximum number of items to return (optional) */
  readonly Limit?: number;
  /** Whether to scan index forward (optional) */
  readonly ScanIndexForward?: boolean;
  /** Exclusive start key for pagination (optional) */
  readonly ExclusiveStartKey?: Record<string, unknown>;
}

/**
 * Result structure for DynamoDB query operations
 * Contains the items returned by a DynamoDB query operation and pagination information for subsequent queries.
 */
export interface DdbQueryResult {
  /** Array of items returned by the query */
  readonly Items?: Record<string, unknown>[];
  /** Last evaluated key for pagination */
  readonly LastEvaluatedKey?: Record<string, unknown>;
  /** Count of items returned (when using Select: "COUNT") */
  readonly Count?: number;
}

/**
 * Type guard to check if a DynamoDB client supports query operations
 * Runtime check to verify if a DynamoDB client implements the query operation required by repositories.
 * @param ddb - The DynamoDB client to check
 * @returns True if the client supports query operations
 */
export function hasQuerySupport(ddb: DdbClientLike): ddb is DdbClientWithQuery {
  return typeof (ddb as any)?.query === "function";
}

/**
 * Type guard to check if a DynamoDB client supports update operations
 * Runtime check to verify if a DynamoDB client implements the update operation required by repositories.
 * @param ddb - The DynamoDB client to check
 * @returns True if the client supports update operations
 */
export function hasUpdateSupport(ddb: DdbClientLike): ddb is DdbClientWithUpdate {
  return typeof (ddb as any)?.update === "function";
}

/**
 * Asserts at runtime that the provided client implements query
 * Throws an error if the client doesn't support the query operation.
 * Used by repositories to ensure required functionality is available.
 * @param ddb - The DynamoDB client to check
 * @throws {Error} When the client doesn't implement query functionality
 */
export function requireQuery(ddb: DdbClientLike): asserts ddb is DdbClientWithQuery {
  if (!hasQuerySupport(ddb)) {
    throw new Error(
      "The provided DDB client does not implement `query(...)`. " +
      "Use a client compatible with DocumentClient.query or provide an adapter exposing it."
    );
  }
}

/**
 * Asserts at runtime that the provided client implements update
 * Throws an error if the client doesn't support the update operation.
 * Used by repositories to ensure required functionality is available.
 * @param ddb - The DynamoDB client to check
 * @throws {Error} When the client doesn't implement update functionality
 */
export function requireUpdate(ddb: DdbClientLike): asserts ddb is DdbClientWithUpdate {
  if (!hasUpdateSupport(ddb)) {
    throw new Error(
      "The provided DDB client does not implement `update(...)`. " +
      "Use a client compatible with DocumentClient.update or provide an adapter exposing it."
    );
  }
}
