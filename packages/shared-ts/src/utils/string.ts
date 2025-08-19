/**
 * String utilities for normalization, casing, trimming and identifiers.
 * @remarks
 * - Rewrote the trailing/leading hyphen trimming in `slugify` without regex to eliminate any risk of super-linear backtracking.
 * - Collapsed non-alphanumeric runs to a single hyphen using a linear-time loop.
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
  s.toLowerCase().replace(/\b([a-z])/g, (_m: string, c: string) => c.toUpperCase());

/**
 * Produces a URL-safe slug.
 * - Normalizes to NFKD and strips combining marks.
 * - Converts to lowercase.
 * - Replaces any run of non-alphanumeric ASCII characters with a single hyphen.
 * - Trims leading/trailing hyphens without regex.
 */
export const slugify = (s: string): string => {
  const ascii = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  let out = "";
  let prevDash = false;
  for (let i = 0; i < ascii.length; i++) {
    const ch = ascii[i]!;
    const code = ch.charCodeAt(0);
    const isAlpha = code >= 97 && code <= 122; // a-z
    const isDigit = code >= 48 && code <= 57; // 0-9
    if (isAlpha || isDigit) {
      out += ch;
      prevDash = false;
      continue;
    }
    if (!prevDash) {
      out += "-";
      prevDash = true;
    }
  }

  let start = 0;
  while (start < out.length && out.charCodeAt(start) === 45) start++; // '-'
  let end = out.length;
  while (end > start && out.charCodeAt(end - 1) === 45) end--; // '-'

  return out.slice(start, end);
};

/** Removes non-printable characters. */
export const stripControlChars = (s: string): string =>
  s.replace(/[\u0000-\u001F\u007F]/g, "");

/** Left pads a string to length with given char. */
export const leftPad = (s: string, len: number, ch = " "): string =>
  s.length >= len ? s : ch.repeat(len - s.length) + s;
