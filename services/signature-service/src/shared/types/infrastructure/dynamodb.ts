/**
 * @file dynamodb.ts
 * @summary DynamoDB-specific types and interfaces
 * @description Shared types for DynamoDB operations, queries, and data structures
 * used across different DynamoDB repositories and mappers.
 */

import type { DdbClientLike } from "@lawprotect/shared-ts";

/**
 * @description Minimal shape of the `query` operation required (SDK-agnostic)
 */
export interface DdbQueryParams {
  TableName: string;
  IndexName?: string;
  KeyConditionExpression: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
  Limit?: number;
  ScanIndexForward?: boolean;
  ExclusiveStartKey?: Record<string, unknown>;
}

/**
 * @description Result structure for DynamoDB query operations
 */
export interface DdbQueryResult {
  Items?: Record<string, unknown>[];
  LastEvaluatedKey?: Record<string, unknown>;
}

/**
 * @description DynamoDB client with `query` support
 */
export interface DdbClientWithQuery extends DdbClientLike {
  query(params: DdbQueryParams): Promise<DdbQueryResult>;
}

/**
 * @description DynamoDB client with `update` support
 */
export interface DdbClientWithUpdate extends DdbClientLike {
  update(params: any): Promise<any>;
}

/**
 * @description Common DynamoDB item structure
 */
export interface DdbItem {
  pk: string;
  sk: string;
  type: string;
  [key: string]: unknown;
}

/**
 * @description DynamoDB item with TTL support
 */
export interface DdbItemWithTTL extends DdbItem {
  ttl?: number;
}

/**
 * @description DynamoDB item with versioning support
 */
export interface DdbItemWithVersion extends DdbItem {
  version: number;
  updatedAt: string;
}

/**
 * @description DynamoDB item with audit fields
 */
export interface DdbItemWithAudit extends DdbItem {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * @description DynamoDB item with tenant isolation
 */
export interface DdbItemWithTenant extends DdbItem {
  tenantId: string;
}

/**
 * @description Complete DynamoDB item with all common fields
 */
export interface DdbItemComplete extends DdbItemWithTTL, DdbItemWithVersion, DdbItemWithAudit, DdbItemWithTenant {}

/**
 * @description Type guard to check if a DynamoDB client supports query operations
 */
export function hasQuerySupport(ddb: DdbClientLike): ddb is DdbClientWithQuery {
  return typeof (ddb as any)?.query === "function";
}

/**
 * @description Type guard to check if a DynamoDB client supports update operations
 */
export function hasUpdateSupport(ddb: DdbClientLike): ddb is DdbClientWithUpdate {
  return typeof (ddb as any)?.update === "function";
}

/**
 * @description Asserts at runtime that the provided client implements `query`.
 * Throws an error if the client doesn't support the query operation.
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
 * @description Asserts at runtime that the provided client implements `update`.
 * Throws an error if the client doesn't support the update operation.
 */
export function requireUpdate(ddb: DdbClientLike): asserts ddb is DdbClientWithUpdate {
  if (!hasUpdateSupport(ddb)) {
    throw new Error(
      "The provided DDB client does not implement `update(...)`. " +
      "Use a client compatible with DocumentClient.update or provide an adapter exposing it."
    );
  }
}
