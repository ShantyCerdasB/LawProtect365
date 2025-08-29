/**
 * @file ToJsonObject.ts
 * @summary Utility for JSON object conversion and undefined value removal
 * @description Utility for converting objects to JSON-compatible format by removing undefined values.
 * Ensures objects satisfy strict JsonObject constraints for stable serialization.
 */

import { JsonObject } from "@lawprotect/shared-ts";

/**
 * @description Produces a shallow JSON object by removing keys with `undefined` values.
 * This helps satisfy strict `JsonObject` constraints for stable serialization.
 *
 * @param {Record<string, unknown>} src - Arbitrary record-like value to convert
 * @returns {JsonObject} A `JsonObject` without `undefined` values
 */
export function toJsonObject(src: Record<string, unknown>): JsonObject {
  return Object.fromEntries(Object.entries(src).filter(([, v]) => v !== undefined)) as JsonObject;
}