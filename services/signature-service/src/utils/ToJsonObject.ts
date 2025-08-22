import { JsonObject } from "@lawprotect/shared-ts";

/**
 * Produces a shallow JSON object by removing keys with `undefined` values.
 * This helps satisfy strict `JsonObject` constraints for stable serialization.
 *
 * @param src Arbitrary record-like value.
 * @returns A `JsonObject` without `undefined` values.
 */
export function toJsonObject(src: Record<string, unknown>): JsonObject {
  return Object.fromEntries(Object.entries(src).filter(([, v]) => v !== undefined)) as JsonObject;
}