/**
 * @file IdempotencyKeyHasher.ts
 * @summary Deterministic key derivation for idempotent request handling.
 * @description
 * Produces a stable SHA-256 hex key from request metadata:
 * method, path, tenant, user, normalized query/body and an optional scope.
 * Uses shared utils only (no AWS SDK).
 */

import { sha256Hex, stableStringify } from "@lawprotect/shared-ts";
import type { IdempotencyKeyInputSchema } from "../../shared/validations/schemas/idempotency";
import type { IdempotencyKeyResult } from "../../shared/types/idempotency";

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
  static derive(input: IdempotencyKeyInputSchema): IdempotencyKeyResult {
    const normalized = IdempotencyKeyHasher.normalize(input);
    const payload = stableStringify(normalized);
    const key = sha256Hex(payload);
    
    return { key, input };
  }

  /**
   * Builds a compact, order-stable object used for hashing.
   * @param i Raw input.
   */
  private static normalize(i: IdempotencyKeyInputSchema): any {
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
