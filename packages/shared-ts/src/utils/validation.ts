/**
 * Lightweight validation helpers and type guards.
 * @remarks
 * - Refactored `isEmail` into small helper functions to reduce cognitive complexity
 *   while keeping a deterministic, linear-time, regex-free validation.
 */

/**
 * Throws when the condition is false.
 *
 * @param cond Condition to assert.
 * @param msg Error message to throw when the assertion fails.
 * @throws Error when the condition is falsy.
 */
export const assert = (cond: unknown, msg = "Assertion failed"): asserts cond => {
  if (!cond) throw new Error(msg);
};

/**
 * Checks whether a value is a non-empty string (after trimming).
 *
 * @param v Any value.
 * @returns True if `v` is a non-empty trimmed string.
 */
export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

/**
 * Parses an integer strictly, rejecting non-integers and out-of-range values.
 *
 * @param s String to parse.
 * @returns Parsed safe integer.
 * @throws Error when the string is not a valid integer or is out of range.
 */
export const parseIntStrict = (s: string): number => {
  if (!/^-?\d+$/.test(s)) throw new Error("Invalid integer");
  const n = Number(s);
  if (!Number.isSafeInteger(n)) throw new Error("Out of range");
  return n;
};

/**
 * Basic, safe email check (linear-time, regex-free for the main structure).
 * @remarks
 * - Requires exactly one "@", with non-empty local and domain parts.
 * - Domain must contain at least one dot not at the start or end.
 * - Disallows whitespace/control characters.
 * - Domain labels: only `[A-Za-z0-9-]`, not starting or ending with "-".
 *
 * @param s Candidate email string.
 * @returns True if `s` satisfies the simplified constraints.
 */
export const isEmail = (s: string): boolean => {
  if (!isLengthWithin(s, 1, 320)) return false;
  if (!isAllPrintableNoSpace(s)) return false;

  const at = s.indexOf("@");
  if (at <= 0 || at !== s.lastIndexOf("@") || at === s.length - 1) return false;

  const local = s.slice(0, at);
  const domain = s.slice(at + 1);

  return isValidLocal(local) && isValidDomain(domain);
};

/**
 * RFC4122 v4 UUID checker.
 *
 * @param s Candidate UUID string.
 * @returns True if `s` matches the RFC4122 v4 pattern.
 */
export const isUuidV4 = (s: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

/**
 * Checks that a string length is within `[min, max]`.
 *
 * @param s Input string.
 * @param min Minimum allowed length.
 * @param max Maximum allowed length.
 * @returns True if within bounds.
 */
const isLengthWithin = (s: string, min: number, max: number): boolean =>
  s.length >= min && s.length <= max;

/**
 * Ensures all characters are printable and non-whitespace.
 *
 * @param s Input string.
 * @returns True if all characters are printable and non-whitespace.
 */
const isAllPrintableNoSpace = (s: string): boolean => {
  for (let i = 0; i < s.length; i++) {
    const c = s.codePointAt(i)!;
    if (c <= 32 || c === 127) return false;
  }
  return true;
}

/**
 * Validates the local part of an email.
 *
 * @param local Local part (before "@").
 * @returns True if the local part passes basic checks.
 */
const isValidLocal = (local: string): boolean => {
  if (!isLengthWithin(local, 1, 64)) return false;
  if (local.startsWith(".") || local.endsWith(".")) return false;
  if (local.includes("..")) return false;
  return true;
};

/**
 * Validates the domain of an email, including labels.
 *
 * @param domain Domain part (after "@").
 * @returns True if the domain passes structural and label checks.
 */
const isValidDomain = (domain: string): boolean => {
  if (!isLengthWithin(domain, 1, 255)) return false;

  const lastDot = domain.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === domain.length - 1) return false; // must have dot not at edges
  if (domain.includes("..")) return false;

  const labels = domain.split(".");
  for (const label of labels) {
    if (!isValidDomainLabel(label)) return false;
  }
  return true;
};

/**
 * Validates a single domain label.
 *
 * @param label Domain label between dots.
 * @returns True if the label is non-empty, not hyphen-wrapped, and contains only `[A-Za-z0-9-]`.
 */
const isValidDomainLabel = (label: string): boolean => {
  if (label.length === 0) return false;
  if (label.startsWith("-") || label.endsWith("-")) return false;
  for (let i = 0; i < label.length; i++) {
    const cc = label.codePointAt(i)!;
    const isDigit = cc >= 48 && cc <= 57;
    const isLower = cc >= 97 && cc <= 122;
    const isUpper = cc >= 65 && cc <= 90;
    const isHyphen = cc === 45;
    if (!(isDigit || isLower || isUpper || isHyphen)) return false;
  }
  return true;
};