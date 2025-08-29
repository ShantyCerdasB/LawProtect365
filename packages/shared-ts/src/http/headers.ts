/**
 * @file headers.ts
 * @summary Helpers to read/validate HTTP headers (case-insensitive, array-safe).
 */

import { AppError, ErrorCodes } from "../index.js";


/** Returns the header value (case-insensitive). If array, returns the first item. */
export function getHeaders(
  headers: Record<string, unknown> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const want = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === want) {
      if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : String(v[0]);
      return typeof v === "string" ? v : (v == null ? undefined : String(v));
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
