/**
 * Lightweight validation helpers and type guards.
 */

/** Throws when condition is false. */
export const assert = (cond: unknown, msg = "Assertion failed"): asserts cond => {
  if (!cond) throw new Error(msg);
};

/** Returns true when value is a non-empty string. */
export const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/** Parses an integer strictly, throwing on invalid input. */
export const parseIntStrict = (s: string): number => {
  if (!/^-?\d+$/.test(s)) throw new Error("Invalid integer");
  const n = Number(s);
  if (!Number.isSafeInteger(n)) throw new Error("Out of range");
  return n;
};

/** Basic RFC5322-ish email check. */
export const isEmail = (s: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** RFC4122 v4 uuid check. */
export const isUuidV4 = (s: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
