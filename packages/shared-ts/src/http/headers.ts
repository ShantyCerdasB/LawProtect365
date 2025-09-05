/**
 * @file headers.ts
 * @summary Helpers to read/validate HTTP headers (case-insensitive, array-safe).
 */

import { AppError, ErrorCodes } from "../index.js";


/**
 * Converts array value to string, taking the first element
 */
function convertArrayValue(value: unknown[]): string {
  return typeof value[0] === "string" ? value[0] : String(value[0]);
}

/**
 * Converts single value to string or undefined
 */
function convertSingleValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value == null) return undefined;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "function") return "[Function]";
  return "[object Object]";
}

/** Returns the header value (case-insensitive). If array, returns the first item. */
export function getHeaders(
  headers: Record<string, unknown> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  
  const want = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === want) {
      return Array.isArray(v) ? convertArrayValue(v) : convertSingleValue(v);
    }
  }
  return undefined;
}

/**
 * Extracts a token-like header. Trims and enforces a minimal length.
 * Returns null when missing/invalid (caller decides which error to throw).
 */
export function extractHeaderToken(
  headers: Record<string, unknown> | undefined,
  name = "x-request-token",
  minLen = 16,
): string | null {
  const raw = getHeaders(headers, name);
  if (!raw) return null;
  const tok = raw.trim();
  if (tok.length < minLen) return null;
  return tok;
}

/**
 * Strict variant that throws a standardized shared error.
 * Use this if no service-specific error mapping is required.
 */
export function requireHeaderToken(
  headers: Record<string, unknown> | undefined,
  name = "x-request-token",
  minLen = 16,
): string {
  const tok = extractHeaderToken(headers, name, minLen);
  if (tok) return tok;
  throw new AppError(
    ErrorCodes.AUTH_FORBIDDEN,
    403,
    `Missing/invalid header: ${name}`,
  );
}
