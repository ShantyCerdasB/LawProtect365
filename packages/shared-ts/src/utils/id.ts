/**
 * Identifier helpers for UUID, ULID and base64url tokens.
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

/** Generates a base64url token of N random bytes. */
export const randomToken = (bytes = 32): string =>
  crypto.randomBytes(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
