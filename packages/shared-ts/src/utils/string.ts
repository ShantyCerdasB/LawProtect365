/**
 * String utilities for normalization, casing, trimming and identifiers.
 */

/** Returns true when the string is empty or only whitespace. */
export const isBlank = (s: string | undefined | null): boolean =>
  !s || s.trim().length === 0;

/** Collapses consecutive whitespace into single spaces and trims ends. */
export const normalizeWhitespace = (s: string): string =>
  s.replace(/\s+/g, " ").trim();

/** Trims a string to max length and appends suffix when truncated. */
export const trimTo = (s: string, max: number, suffix = "…"): string =>
  s.length <= max ? s : s.slice(0, Math.max(0, max - suffix.length)) + suffix;

/** Converts text to Title Case (basic ASCII-safe). */
export const toTitleCase = (s: string): string =>
  s.toLowerCase().replace(/\b([a-z])/g, (m, c: string) => c.toUpperCase());

/** Produces a URL-safe slug. */
export const slugify = (s: string): string =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Removes non-printable characters. */
export const stripControlChars = (s: string): string =>
  s.replace(/[\u0000-\u001F\u007F]/g, "");

/** Left pads a string to length with given char. */
export const leftPad = (s: string, len: number, ch = " "): string =>
  s.length >= len ? s : ch.repeat(len - s.length) + s;
