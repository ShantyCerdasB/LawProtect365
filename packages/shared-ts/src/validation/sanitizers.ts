import { z } from "zod";

/**
 * Zod preprocessors and transformers for trimming and normalization.
 */

/** Trims incoming strings and rejects empty results. */
export const TrimmedString = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.string().min(1, "Required")
);

/** Lowercases and trims email-like inputs, then validates shape. */
export const NormalizedEmail = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.string().email("Invalid email")
);

/** Collapses inner whitespace to single spaces and trims ends. */
export const CollapsedWhitespace = z
  .string()
  .transform((s) => s.replaceAll(/\s+/g, " ").trim());
