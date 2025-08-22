/**
 * @file IdempotencyKeyHasher.ts
 * @summary Deterministic key derivation for idempotent request handling.
 * @description
 * Produces a stable SHA-256 hex key from request metadata:
 * method, path, tenant, user, normalized query/body and an optional scope.
 * Uses shared utils only (no AWS SDK).
 */

import { sha256Hex } from "@lawprotect/shared-ts";
import { stableStringify, type JsonObject } from "@lawprotect/shared-ts";

/** Metadata captured to derive an idempotency key. */
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
 * Derives stable hex keys from request metadata.
 * Keys are independent of property order due to stable stringification.
 */
export class IdempotencyKeyHasher {
  /**
   * Derives a SHA-256 hex key from the input.
   * @param input Request metadata.
   * @returns 64-char hex string.
   */
  static derive(input: IdempotencyKeyInput): string {
    const normalized = IdempotencyKeyHasher.normalize(input);
    const payload = stableStringify(normalized);
    return sha256Hex(payload);
  }

  /**
   * Builds a compact, order-stable object used for hashing.
   * @param i Raw input.
   */
  private static normalize(i: IdempotencyKeyInput): JsonObject {
    return {
      m: i.method.toUpperCase(),
      p: i.path,
      t: i.tenantId,
      u: i.userId,
      q: i.query ?? null,
      b: i.body ?? null,
      s: i.scope ?? ""
    } as const;
  }
}
