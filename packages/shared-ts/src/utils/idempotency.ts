/**
 * @file idempotency.ts
 * @summary Idempotency utility functions for DynamoDB operations
 * @description Utility functions for idempotency operations, TTL calculations, and DynamoDB item formatting
 */

import { stableStringify } from "./json.js";

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
    // Handle undefined explicitly
    if (result === undefined) {
      return stableStringify({ ok: false, reason: "non-serializable-result" });
    }
    
    // Check for non-serializable types before attempting to stringify
    if (typeof result === 'function' || typeof result === 'symbol' || typeof result === 'bigint') {
      return stableStringify({ ok: false, reason: "non-serializable-result" });
    }
    
    // Check for objects with non-serializable properties
    if (typeof result === 'object' && result !== null) {
      const hasNonSerializable = (obj: any): boolean => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
              return true;
            }
            if (typeof value === 'object' && value !== null && hasNonSerializable(value)) {
              return true;
            }
          }
        }
        return false;
      };
      
      if (hasNonSerializable(result)) {
        return stableStringify({ ok: false, reason: "non-serializable-result" });
      }
    }
    
    return stableStringify(result as any);
  } catch {
    return stableStringify({ ok: false, reason: "non-serializable-result" });
  }
};
