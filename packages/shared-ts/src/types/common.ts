import type { Brand } from "./brand.js";

/**
 * @file types.ts
 * @summary Common type aliases, branded types, and utility helpers for JSON and domain values.
 */

/** Nullable helper. */
export type Nullable<T> = T | null;

/** JSON primitives. */
export type JsonPrimitive = string | number | boolean | null;

/** JSON array type. */
export type JsonArray = JsonValue[];

/** JSON object type. */
export type JsonObject = { [k: string]: JsonValue };

/** JSON value (recursive union). */
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/**
 * ISO-8601 timestamp string.
 *
 * @example "2025-08-16T18:23:59Z"
 */
export type ISODateString = Brand<string, "ISODateString">;

/**
 * Milliseconds since epoch.
 *
 * @example 1734442345123
 */
export type Millis = Brand<number, "Millis">;

/**
 * Discriminated union for success/failure flows.
 *
 * @typeParam T - Value type in success case.
 * @typeParam E - Error type in failure case (defaults to `unknown`).
 */
export type Result<T, E = unknown> =
  | { ok: true; value: T }
  | { ok: false; error: E };
