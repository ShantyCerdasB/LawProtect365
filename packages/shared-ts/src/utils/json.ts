/**
 * JSON utilities for safe parsing, stable stringification, deep cloning,
 * and equality checks. Designed to be deterministic and side-effect free.
 */

import type { JsonValue } from "../types/common.js";

/**
 * Parses a JSON string and throws on error with a clean message.
 * @param text JSON source.
 * @param reviver Optional custom reviver.
 */
export const parseJson = <T = unknown>(
  text: string,
  reviver?: (this: unknown, key: string, value: unknown) => unknown
): T => {
  try {
    return JSON.parse(text, reviver) as T;
  } catch (e) {
    const msg = (e as Error)?.message ?? "Invalid JSON";
    throw new Error(msg);
  }
};

/**
 * Parses JSON safely and returns a discriminated union.
 * @param text JSON source.
 * @param reviver Optional custom reviver.
 */
export const parseJsonSafe = <T = unknown>(
  text: string,
  reviver?: (this: unknown, key: string, value: unknown) => unknown
): { ok: true; value: T } | { ok: false; error: Error } => {
  try {
    return { ok: true, value: JSON.parse(text, reviver) as T };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
};

/**
 * Parses a base64-encoded JSON string.
 * @param b64 Base64 text.
 */
export const parseBase64Json = <T = unknown>(b64: string): T => {
  const buf = Buffer.from(b64, "base64");
  return parseJson<T>(buf.toString("utf8"));
};

/**
 * Stringifies a value with stable key ordering and optional spacing.
 * @param value JSON-serializable value.
 * @param space Number of spaces for pretty output.
 */
export const stableStringify = (value: JsonValue, space?: number): string => {
  const seen = new WeakSet<object>();

  const sorter = (val: any): any => {
    if (val === null || typeof val !== "object") return val;
    if (seen.has(val)) throw new TypeError("Converting circular structure to JSON");
    seen.add(val);

    if (Array.isArray(val)) return val.map(sorter);

    const out: Record<string, unknown> = {};
    for (const key of Object.keys(val).sort()) {
      out[key] = sorter(val[key]);
    }
    return out;
  };

  return JSON.stringify(sorter(value), undefined, space);
};

/**
 * Creates a deep clone via structuredClone or stable JSON round-trip.
 * @param value JSON-serializable value.
 */
export const deepClone = <T extends JsonValue>(value: T): T => {
  // @ts-ignore Node 18+ has structuredClone
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

/**
 * Compares two JSON values using stable stringification.
 * @param a First value.
 * @param b Second value.
 */
export const jsonEquals = (a: JsonValue, b: JsonValue): boolean =>
  stableStringify(a) === stableStringify(b);

/**
 * Returns true when value is a plain JSON object.
 * @param v Candidate value.
 */
export const isJsonObject = (v: unknown): v is Record<string, JsonValue> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Returns a compact JSON string with no trailing spaces.
 * @param value JSON-serializable value.
 */
export const stringifyCompact = (value: JsonValue): string =>
  JSON.stringify(value);
