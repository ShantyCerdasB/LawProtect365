import { stableStringify, parseJson } from "@utils/json.js";
import { toBase64Url } from "@utils/crypto.js";
import type { JsonValue } from "../types/common.js";

/**
 * Opaque cursor helpers based on base64url-encoded stable JSON.
 * Encodes only public fields; never include sensitive data.
 */

/**
 * Encodes a JSON-serializable value into an opaque cursor string.
 * @param value JSON-serializable payload.
 */
export const encodeCursor = (value: JsonValue): string =>
  toBase64Url(Buffer.from(stableStringify(value)));

/**
 * Decodes an opaque cursor string, returning undefined on failure.
 * @param cursor Opaque cursor.
 */
export const decodeCursor = <T = unknown>(cursor?: string): T | undefined => {
  if (!cursor) return undefined;
  try {
    const json = Buffer.from(cursor, "base64").toString("utf8");
    return parseJson<T>(json);
  } catch {
    return undefined;
  }
};

/**
 * Coerces arbitrary input into a JSON value suitable for cursors.
 * Converts common non-JSON types (Date, Buffer, bigint) into strings.
 * @param v Arbitrary value.
 */
export const toJsonValue = (v: unknown): JsonValue => {
  if (v === null) return null;
  const t = typeof v;

  if (t === "string" || t === "boolean") return v as JsonValue;
  if (t === "number") return Number.isFinite(v as number) ? (v as number) : (v as number).toString() as JsonValue;
  if (t === "bigint") return (v as bigint).toString();

  // Node Buffer → base64url
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (typeof Buffer !== "undefined" && Buffer.isBuffer?.(v)) {
    return toBase64Url(v as Buffer);
  }

  if (v instanceof Date) return v.toISOString();

  if (Array.isArray(v)) {
    return v.map((x) => toJsonValue(x)) as JsonValue;
  }

  if (t === "object") {
    const out: Record<string, JsonValue> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = toJsonValue(val);
    }
    return out as JsonValue;
  }

  // Fallback: stringify symbols/functions/undefined
  if (typeof v === "symbol") return v.toString() as JsonValue;
  if (typeof v === "function") return "[Function]" as JsonValue;
  return "[object Object]" as JsonValue;
};

/**
 * Builds a cursor from selected fields of a record.
 * Non-JSON values (Date, Buffer, bigint) are coerced safely.
 *
 * @param record Source record.
 * @param fields Field names to include in the cursor payload.
 */
export const cursorFromRecord = <T extends object>(
  record: T,
  fields: Array<keyof T>
): string => {
  const payload: Record<string, JsonValue> = {};
  for (const f of fields) {
    payload[String(f)] = toJsonValue((record as any)[f]);
  }
  return encodeCursor(payload);
};
