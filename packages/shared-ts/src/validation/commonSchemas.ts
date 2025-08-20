import { z } from "zod";

/**
 * @file schemas.ts
 * @summary Common reusable Zod schemas for strings, dates, numbers, and JSON structures.
 * @remarks
 * - Control-character regex replaced with a deterministic loop (`hasAsciiControl`)
 *   to satisfy linters (e.g., `no-control-regex`) and avoid backtracking risks.
 */

/**
 * Returns true if the string contains any ASCII control characters (U+0000–U+001F or U+007F).
 *
 * @param s - Input string to inspect.
 * @returns True if `s` contains ASCII control characters.
 */
const hasAsciiControl = (s: string): boolean => {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 0x1f || c === 0x7f) return true;
  }
  return false;
};

/** Non-empty UTF-16 string. */
export const NonEmptyStringSchema = z.string().min(1, "Required");

/**
 * String without ASCII control characters (U+0000–U+001F, U+007F).
 *
 * @remarks Uses a loop-based check instead of a control-character regex.
 */
export const SafeStringSchema = z
  .string()
  .refine((s) => !hasAsciiControl(s), "Control characters not allowed");

/**
 * ISO-8601 date-time string (basic permissive check using `Date.parse`).
 *
 * @example
 * ```ts
 * ISODateStringSchema.parse("2025-08-16T18:23:59Z"); // ✅
 * ISODateStringSchema.parse("not-a-date"); // ❌ throws
 * ```
 */
export const ISODateStringSchema = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid ISO-8601 timestamp");

/** RFC5322-ish email string (delegates to Zod's built-in email validator). */
export const EmailStringSchema = z.string().email("Invalid email");

/** Positive 32/53-bit safe integer. */
export const PositiveIntSchema = z.number().int().positive();

/** Arbitrary JSON-compatible unknown value. */
export const JsonUnknownSchema: z.ZodType<unknown> = z.any();

/** Record of JSON-compatible values, defaulting to an empty object. */
export const JsonObjectSchema = z.record(z.any()).default({});
