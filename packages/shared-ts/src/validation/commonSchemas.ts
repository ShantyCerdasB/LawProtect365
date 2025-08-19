import { z } from "zod";

/**
 * @file schemas.ts
 * @summary Common reusable Zod schemas (strings, dates, numbers).
 * @remarks
 * - Replaced the control-character regex in `SafeString` with a deterministic loop to satisfy linters (e.g., `no-control-regex`)
 *   and to avoid any potential backtracking risks.
 */

/**
 * Returns true if the string contains any ASCII control characters (U+0000–U+001F or U+007F).
 *
 * @param s Input string to inspect.
 * @returns Whether the string contains ASCII control characters.
 */
const hasAsciiControl = (s: string): boolean => {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 0x1f || c === 0x7f) return true;
  }
  return false;
};

/** Non-empty UTF-16 string. */
export const NonEmptyString = z.string().min(1, "Required");

/**
 * String without ASCII control characters (U+0000–U+001F, U+007F).
 * @remarks Uses a loop-based check instead of a control-character regex.
 */
export const SafeString = z
  .string()
  .refine((s) => !hasAsciiControl(s), "Control characters not allowed");

/** ISO-8601 date-time string (basic permissive check using Date.parse). */
export const ISODateString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid ISO-8601 timestamp");

/** RFC5322-ish email string (delegates to Zod's built-in email validator). */
export const EmailString = z.string().email("Invalid email");

/** Positive 32/53-bit safe integer. */
export const PositiveInt = z.number().int().positive();

/** Arbitrary JSON-compatible unknown. */
export const JsonUnknown: z.ZodType<unknown> = z.any();

/** Record of JSON-compatible values, defaulting to an empty object. */
export const JsonObject = z.record(z.any()).default({});
