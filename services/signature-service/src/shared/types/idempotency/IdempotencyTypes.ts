/**
 * @file IdempotencyTypes.ts
 * @summary Core types for idempotency operations
 * @description Defines interfaces for idempotency key generation and execution
 */

import type { JsonObject } from "@lawprotect/shared-ts";

/**
 * Input for deriving an idempotency key.
 */
export interface IdempotencyKeyInput {
  /** HTTP method (e.g., GET, POST). */
  method: string;
  /** API route/path (as received). */
  path: string;
  /** Tenant or organization id. */
  tenantId: string;
  /** End user id. */
  userId: string;
  /** Normalized query parameters object (or null). */
  query: JsonObject | null;
  /** Normalized JSON body (or null). */
  body: JsonObject | null;
  /** Optional logical scope (service/feature). */
  scope?: string;
}

/**
 * Result of idempotency key derivation.
 */
export interface IdempotencyKeyResult {
  /** The derived idempotency key (SHA-256 hash). */
  key: string;
  /** Input parameters used for derivation. */
  input: IdempotencyKeyInput;
}

/**
 * Configuration options for the idempotency runner.
 */
export interface IdempotencyRunnerOptions {
  /** Default TTL (seconds) used when none is provided per run. */
  defaultTtlSeconds?: number;
}

/**
 * Options for individual idempotency runs.
 */
export interface IdempotencyRunOptions {
  /** Idempotency key for this operation. */
  key: string;
  /** TTL for the idempotency record in seconds. */
  ttlSeconds?: number;
}
