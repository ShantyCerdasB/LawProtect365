/**
 * @file queries.ts
 * @summary Common query types and interfaces
 * @description Shared types for application queries and query handlers
 */

import type { BaseQuery, ActorContext } from "./ports";
import type { PaginationParams, PaginationResult, FilterCriteria, SortCriteria } from "../domain/common";

/**
 * @description Query handler interface
 */
export interface QueryHandler<TQuery extends BaseQuery, TResult> {
  /** Handle a query */
  handle(query: TQuery): Promise<TResult>;
}

/**
 * @description Query bus interface
 */
export interface QueryBus {
  /** Execute a query */
  execute<TQuery extends BaseQuery, TResult>(query: TQuery): Promise<TResult>;
}

/**
 * @description Query middleware interface
 */
export interface QueryMiddleware<TQuery extends BaseQuery, TResult> {
  /** Process query through middleware */
  process(query: TQuery, next: QueryHandler<TQuery, TResult>): Promise<TResult>;
}

/**
 * @description Query validation result
 */
export interface QueryValidationResult {
  /** Whether the query is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}

/**
 * @description Query validator interface
 */
export interface QueryValidator<TQuery extends BaseQuery> {
  /** Validate a query */
  validate(query: TQuery): QueryValidationResult;
}

/**
 * @description Query authorization result
 */
export interface QueryAuthorizationResult {
  /** Whether the query is authorized */
  isAuthorized: boolean;
  /** Authorization errors */
  errors: string[];
  /** Required permissions */
  requiredPermissions: string[];
}

/**
 * @description Query authorizer interface
 */
export interface QueryAuthorizer<TQuery extends BaseQuery> {
  /** Authorize a query */
  authorize(query: TQuery, actor: ActorContext): QueryAuthorizationResult;
}

/**
 * @description Query audit information
 */
export interface QueryAuditInfo {
  /** Query ID */
  queryId: string;
  /** Query type */
  queryType: string;
  /** Actor information */
  actor: ActorContext;
  /** Execution timestamp */
  executedAt: string;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Whether the query was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Result count */
  resultCount?: number;
}

/**
 * @description Query auditor interface
 */
export interface QueryAuditor {
  /** Audit a query execution */
  audit(info: QueryAuditInfo): Promise<void>;
}

/**
 * @description Query cache configuration
 */
export interface QueryCacheConfig {
  /** Whether to cache the query result */
  enabled: boolean;
  /** Cache TTL in seconds */
  ttlSeconds: number;
  /** Cache key prefix */
  keyPrefix: string;
  /** Whether to include actor in cache key */
  includeActorInKey: boolean;
}

/**
 * @description Query with cache configuration
 */
export interface CacheableQuery<TQuery extends BaseQuery> {
  /** The query to execute */
  query: TQuery;
  /** Cache configuration */
  cacheConfig: QueryCacheConfig;
}

/**
 * @description Query result cache interface
 */
export interface QueryResultCache<TResult> {
  /** Get cached result */
  get(key: string): Promise<TResult | null>;
  /** Set cached result */
  set(key: string, result: TResult, ttlSeconds: number): Promise<void>;
  /** Delete cached result */
  delete(key: string): Promise<void>;
  /** Clear all cached results */
  clear(): Promise<void>;
}

/**
 * @description Query performance metrics
 */
export interface QueryPerformanceMetrics {
  /** Query execution time in milliseconds */
  executionTimeMs: number;
  /** Database query time in milliseconds */
  databaseTimeMs: number;
  /** Cache hit/miss information */
  cacheHit: boolean;
  /** Result count */
  resultCount: number;
  /** Memory usage in bytes */
  memoryUsageBytes: number;
}

/**
 * @description Query performance monitor interface
 */
export interface QueryPerformanceMonitor {
  /** Record query performance metrics */
  record(metrics: QueryPerformanceMetrics): Promise<void>;
}

/**
 * @description Query result transformer interface
 */
export interface QueryResultTransformer<TInput, TOutput> {
  /** Transform query result */
  transform(input: TInput): TOutput;
}

/**
 * @description Query result with metadata
 */
export interface QueryResultWithMetadata<T> {
  /** Query result data */
  data: T;
  /** Query metadata */
  metadata: {
    /** Query execution time */
    executionTimeMs: number;
    /** Cache information */
    cacheHit: boolean;
    /** Result count */
    resultCount: number;
    /** Query timestamp */
    timestamp: string;
  };
}
