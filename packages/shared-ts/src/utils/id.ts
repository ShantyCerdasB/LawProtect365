/**
 * Identifier helpers for UUID, ULID and base64url tokens.
 * @remarks
 * - Uses a regex-free base64url conversion fallback in `randomToken`.
 */

import * as crypto from "node:crypto";

/** Generates an RFC 4122 v4 UUID using Node's crypto. */
export const uuid = (): string => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const buf = crypto.randomBytes(16);
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  const hex = buf.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/** Generates a ULID (lexicographically sortable). */
/**
 * Generates a ULID using secure RNG
 * ULID spec: 48-bit timestamp + 80-bit randomness, Crockford's Base32 (26 chars).
 */
export const ulid = (): string => {
  const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

  const encodeTime = (time: number): string => {
    // 48-bit timestamp -> 10 chars (base32)
    let t = Math.floor(time);
    let out = "";
    for (let i = 0; i < 10; i++) {
      out = ALPHABET[t % 32] + out;
      t = Math.floor(t / 32);
    }
    return out;
  };

  const encodeRandom = (): string => {
    // 80 bits randomness -> 16 chars. Use crypto bytes and map 5-bit chunks.
    const bytes = crypto.randomBytes(10); // 80 bits
    const chars = new Array<string>(16);
    let idx = 0;
    // pack 5-bit groups
    for (let i = 0; i < 10; i += 5) {
      const b0 = bytes[i] ?? 0;
      const b1 = bytes[i + 1] ?? 0;
      const b2 = bytes[i + 2] ?? 0;
      const b3 = bytes[i + 3] ?? 0;
      const b4 = bytes[i + 4] ?? 0;

      // 5 bytes = 40 bits -> 8 groups of 5 bits
      const v0 = (b0 & 0b11111000) >> 3;
      const v1 = ((b0 & 0b00000111) << 2) | ((b1 & 0b11000000) >> 6);
      const v2 = (b1 & 0b00111110) >> 1;
      const v3 = ((b1 & 0b00000001) << 4) | ((b2 & 0b11110000) >> 4);
      const v4 = ((b2 & 0b00001111) << 1) | ((b3 & 0b10000000) >> 7);
      const v5 = (b3 & 0b01111100) >> 2;
      const v6 = ((b3 & 0b00000011) << 3) | ((b4 & 0b11100000) >> 5);
      const v7 = b4 & 0b00011111;

      chars[idx++] = ALPHABET[v0];
      chars[idx++] = ALPHABET[v1];
      chars[idx++] = ALPHABET[v2];
      chars[idx++] = ALPHABET[v3];
      chars[idx++] = ALPHABET[v4];
      chars[idx++] = ALPHABET[v5];
      chars[idx++] = ALPHABET[v6];
      chars[idx++] = ALPHABET[v7];
    }
    return chars.join("");
  };

  return encodeTime(Date.now()) + encodeRandom();
};

/**
 * Generates a base64url token of N random bytes.
 * Prefers `Buffer.toString("base64url")` when available; otherwise uses a safe, regex-free conversion.
 * @param bytes Number of random bytes to generate (default: 32).
 * @returns Base64url-encoded token.
 */
export const randomToken = (bytes = 32): string => {
  const buf = crypto.randomBytes(bytes);

  // Prefer native base64url support when available.
  if ((Buffer as any).isEncoding?.("base64url")) {
    return buf.toString("base64url");
  }

  // Fallback: convert base64 -> base64url without regex.
  const base64 = buf.toString("base64");

  // Replace '+' -> '-', '/' -> '_' without regex.
  let out = "";
  for (const ch of base64) {
    if (ch === "+") out += "-";
    else if (ch === "/") out += "_";
    else out += ch;
  }

  // Strip trailing '=' padding deterministically.
  let end = out.length - 1;
  while (end >= 0 && out[end] === "=") end--;
  return out.slice(0, end + 1);
};
