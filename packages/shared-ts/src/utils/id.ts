/**
 * Identifier helpers for UUID, ULID and base64url tokens.
 * @remarks
 * - Replaced the regex-based base64url conversion in `randomToken` with a regex-free implementation to avoid any potential super-linear backtracking.
 */

import * as crypto from "node:crypto";
import { ulid as makeUlid } from "ulid";

/** Generates a RFC 4122 v4 UUID using Node's crypto. */
export const uuid = (): string => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const buf = crypto.randomBytes(16);
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  const hex = buf.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/** Generates a ULID (lexicographically sortable). */
export const ulid = (): string => makeUlid();

/**
 * Generates a base64url token of N random bytes.
 * Uses `Buffer.toString("base64url")` when available; otherwise falls back to a safe, regex-free conversion.
 * @param bytes Number of random bytes to generate (default: 32).
 * @returns Base64url-encoded token.
 */
export const randomToken = (bytes = 32): string => {
  const buf = crypto.randomBytes(bytes);

  // Prefer native base64url support when available.
  // `Buffer.isEncoding("base64url")` exists in supported Node versions.
  if ((Buffer as any).isEncoding?.("base64url")) {
    return buf.toString("base64url");
  }

  // Fallback: convert base64 -> base64url without regex.
  const base64 = buf.toString("base64");

  // Replace '+' -> '-', '/' -> '_' without using regex.
  let out = "";
  for (let i = 0; i < base64.length; i++) {
    const ch = base64[i]!;
    if (ch === "+") out += "-";
    else if (ch === "/") out += "_";
    else out += ch;
  }

  // Strip trailing '=' padding deterministically.
  let end = out.length - 1;
  while (end >= 0 && out[end] === "=") end--;
  return out.slice(0, end + 1);
};
