/**
 * String utilities for normalization, casing, trimming and identifiers.
 * @remarks
 * - Trailing/leading hyphen trimming in `slugify` is regex-free.
 * - Non-alphanumeric runs collapse in linear time.
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
 * @param s Input string to slugify.
 * @returns A lowercase, URL-safe slug.
 */
export const slugify = (s: string): string => {
  const ascii = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  let out = "";
  let prevDash = false;
  for (let i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    const isAlpha = code >= 97 && code <= 122; // a-z
    const isDigit = code >= 48 && code <= 57; // 0-9
    if (isAlpha || isDigit) {
      out += ascii[i];
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

/** Removes ASCII control characters (U+0000–U+001F, U+007F). */
export const stripControlChars = (s: string): string => {
  return s.split('').filter(char => {
    const code = char.charCodeAt(0);
    return !(code >= 0 && code <= 31) && code !== 127;
  }).join('');
};

/** Left-pads a string to the given length using the provided character. */
export const leftPad = (s: string, len: number, ch = " "): string =>
  s.length >= len ? s : ch.repeat(len - s.length) + s;

