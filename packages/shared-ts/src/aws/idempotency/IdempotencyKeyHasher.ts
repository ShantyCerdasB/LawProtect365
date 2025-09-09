/**
 * @file IdempotencyKeyHasher.ts
 * @summary Deterministic key derivation for idempotent request handling.
 * @description
 * Produces a stable SHA-256 hex key from request metadata:
 * method, path, tenant, user, normalized query/body and an optional scope.
 * Uses shared utils only (no AWS SDK).
 */

import { sha256Hex, stableStringify } from "../../index.js";

/**
 * Input schema for generating idempotency keys.
 */
export interface IdempotencyKeyInput {
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Tenant identifier */
  tenantId: string;
  /** User identifier */
  userId: string;
  /** Query parameters */
  query?: Record<string, any>;
  /** Request body */
  body?: Record<string, any>;
  /** Optional scope for additional context */
  scope?: string;
}

/**
 * Result of idempotency key generation.
 */
export interface IdempotencyKeyResult {
  /** Generated idempotency key */
  key: string;
  /** Original input for debugging */
  input: IdempotencyKeyInput;
}

/**
 * Derives stable hex keys from request metadata.
 * Keys are independent of property order due to stable stringification.
 */
export class IdempotencyKeyHasher {
  /**
   * Derives a SHA-256 hex key from the input.
   * @param input Request metadata.
   * @returns Idempotency key result with branded type.
   */
  static derive(input: IdempotencyKeyInput): IdempotencyKeyResult {
    const normalized = IdempotencyKeyHasher.normalize(input);
    const payload = stableStringify(normalized);
    const key = sha256Hex(payload);
    
    return { key, input };
  }

  /**
   * Builds a compact, order-stable object used for hashing.
   * @param i Raw input.
   */
  private static normalize(i: IdempotencyKeyInput): any {
    return {
      m: i.method.toUpperCase(),
      p: i.path,
      t: i.tenantId,
      u: i.userId,
      q: i.query ?? null,
      b: i.body ?? null,
      s: i.scope ?? ""
    };
  }
}






