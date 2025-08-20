/**
 * IdempotencyKeyHasher
 * ---------------------
 * Derives deterministic keys for idempotency control.
 *
 * Keys are derived from request metadata (method, path, tenant, user, query, body).
 * Ensures stable hashing regardless of field ordering.
 *
 * @remarks
 * - Does **NOT** depend on AWS SDK.
 * - Uses only shared contracts (`IdempotencyStore`) and utils (`crypto`, `stableStringify`).
 */

import { sha256Hex } from "@lawprotect/shared-ts";
import { stableStringify, type JsonValue, type JsonObject } from "@lawprotect/shared-ts";

export interface IdempotencyKeyInput {
  method: string;   // HTTP method
  path: string;     // API route
  tenantId: string; // Tenant / org
  userId: string;   // End user ID
  query: JsonObject | null; // Query params (normalized)
  body: JsonObject | null;  // Body params (normalized)
  scope: string;    // Optional logical scope (per-service)
}

export class IdempotencyKeyHasher {
  /**
   * Derives a stable SHA-256 hex key from request metadata.
   * @param input - Request metadata including route, user, tenant, etc.
   * @returns Hex-encoded hash string
   */
  static derive(input: IdempotencyKeyInput): string {
    // Normalize fields to ensure consistent hashing
    const normalized: JsonObject = {
      m: input.method.toUpperCase(),
      p: input.path,
      t: input.tenantId,
      u: input.userId,
      q: input.query ?? null,
      b: input.body ?? null,
      s: input.scope,
    };

    // stableStringify expects a JsonValue, so we force type here
    const str = stableStringify(normalized as JsonValue);
    return sha256Hex(str);
  }
}
