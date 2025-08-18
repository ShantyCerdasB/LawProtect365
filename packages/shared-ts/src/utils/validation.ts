/**
 * Lightweight validation helpers and type guards.
 * @remarks
 * - Replaced the regex-based `isEmail` with a deterministic, linear-time validator to avoid any backtracking risks.
 * - Consolidated duplicate `isEmail` declarations into a single implementation.
 */

/** Throws when condition is false. */
export const assert = (cond: unknown, msg = "Assertion failed"): asserts cond => {
  if (!cond) throw new Error(msg);
};

/** Returns true when value is a non-empty string. */
export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

/** Parses an integer strictly, throwing on invalid input. */
export const parseIntStrict = (s: string): number => {
  if (!/^-?\d+$/.test(s)) throw new Error("Invalid integer");
  const n = Number(s);
  if (!Number.isSafeInteger(n)) throw new Error("Out of range");
  return n;
};

/**
 * Basic, safe email check (linear-time, regex-free).
 * - Requires exactly one "@"
 * - Non-empty local and domain parts
 * - Domain contains at least one dot, not at start or end
 * - No whitespace or control characters
 * - Domain labels do not start/end with "-" and contain only [A-Za-z0-9-]
 * - Prevents catastrophic backtracking by avoiding regex
 */
export const isEmail = (s: string): boolean => {
  if (!s || s.length > 320) return false; // typical combined length ceiling
  // Disallow whitespace/control chars
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 32 || c === 127) return false;
  }

  const at = s.indexOf("@");
  if (at <= 0 || at !== s.lastIndexOf("@") || at === s.length - 1) return false;

  const local = s.slice(0, at);
  const domain = s.slice(at + 1);

  if (local.length === 0 || local.length > 64) return false;
  if (domain.length === 0 || domain.length > 255) return false;

  // Local-part rudimentary checks
  if (local[0] === "." || local[local.length - 1] === "." || local.includes("..")) return false;

  // Domain must contain a dot not at the ends
  const lastDot = domain.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === domain.length - 1) return false;

  // No consecutive dots in domain
  if (domain.includes("..")) return false;

  // Validate each domain label
  const labels = domain.split(".");
  for (const label of labels) {
    if (!label) return false;
    if (label[0] === "-" || label[label.length - 1] === "-") return false;
    for (let i = 0; i < label.length; i++) {
      const cc = label.charCodeAt(i);
      const isDigit = cc >= 48 && cc <= 57;
      const isLower = cc >= 97 && cc <= 122;
      const isUpper = cc >= 65 && cc <= 90;
      const isHyphen = cc === 45;
      if (!(isDigit || isLower || isUpper || isHyphen)) return false;
    }
  }

  return true;
};

/** RFC4122 v4 uuid check. */
export const isUuidV4 = (s: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
