import type { Brand } from "./brand.js";

/** Nullable helper. */
export type Nullable<T> = T | null;

/** JSON primitives. */
export type JsonPrimitive = string | number | boolean | null;
/** JSON array. */
export type JsonArray = JsonValue[];
/** JSON object. */
export type JsonObject = { [k: string]: JsonValue };
/** JSON value (recursive). */
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/**
 * ISO-8601 timestamp string, e.g., "2025-08-16T18:23:59Z".
 */
export type ISODateString = Brand<string, "ISODateString">;

/**
 * Milliseconds since epoch.
 */
export type Millis = Brand<number, "Millis">;

/**
 * Discriminated union for success/failure flows.
 */
export type Result<T, E = unknown> =
  | { ok: true; value: T }
  | { ok: false; error: E };
