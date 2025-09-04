/**
 * @file idempotencyUtils.ts
 * @summary Idempotency utility functions
 * @description Utility functions for idempotency operations
 */

import { stableStringify } from "@lawprotect/shared-ts";

/**
 * @description Converts a relative TTL in seconds to epoch seconds.
 * @param {number | undefined} ttlSeconds Relative TTL in seconds.
 * @returns {number | undefined} Epoch seconds or `undefined` if `ttlSeconds` is falsy or not positive.
 */
export const toTtl = (ttlSeconds: number | undefined): number | undefined =>
  typeof ttlSeconds === "number" && ttlSeconds > 0
    ? Math.floor(Date.now() / 1000) + Math.floor(ttlSeconds)
    : undefined;

/**
 * @description Narrows an object to the DocumentClient-compatible item shape.
 * @param {T} v Arbitrary object.
 * @returns {Record<string, unknown>} The same value typed as `Record<string, unknown>`.
 */
export const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/**
 * @description Produces a stable JSON snapshot for an arbitrary payload.
 * @param {unknown} result Payload to snapshot.
 * @returns {string} JSON string; falls back to a safe payload if serialization fails.
 */
export const stringifyResult = (result: unknown): string => {
  try {
    return stableStringify(result as any);
  } catch {
    return stableStringify({ ok: false, reason: "non-serializable-result" });
  }
};

