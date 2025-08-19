/**
 * @file validation.test.ts
 * @summary Tests for validation helpers: assert, isNonEmptyString, parseIntStrict, isEmail, isUuidV4.
 * @remarks
 * - Email tests follow the documented constraints (single "@", dot in domain, label rules, length caps).
 * - Integer parsing rejects non-integers and values outside Number.MAX_SAFE_INTEGER bounds.
 * - Notes: JavaScript distinguishes +0 and -0. This suite accepts either for "-0".
 * - UUID checks enforce RFC4122 v4 version/variant.
 */

import {
  assert,
  isNonEmptyString,
  parseIntStrict,
  isEmail,
  isUuidV4,
} from "../../src/utils/validation.js";

/** assert */
describe("assert", () => {
  it("does not throw when condition is truthy", () => {
    expect(() => assert(1 === 1)).not.toThrow();
  });

  it("throws with the provided message when condition is falsy", () => {
    expect(() => assert(false, "nope")).toThrow("nope");
  });
});

/** isNonEmptyString */
describe("isNonEmptyString", () => {
  it("returns true for non-empty strings (trimmed)", () => {
    expect(isNonEmptyString("a")).toBe(true);
    expect(isNonEmptyString("  hi ")).toBe(true);
  });

  it("returns false for empty or whitespace-only strings and non-strings", () => {
    expect(isNonEmptyString("")).toBe(false);
    expect(isNonEmptyString("   ")).toBe(false);
    expect(isNonEmptyString(null)).toBe(false as any);
    expect(isNonEmptyString(undefined)).toBe(false as any);
    expect(isNonEmptyString(0)).toBe(false as any);
    expect(isNonEmptyString({})).toBe(false as any);
    expect(isNonEmptyString([])).toBe(false as any);
  });
});

/** parseIntStrict */
describe("parseIntStrict", () => {
  it("parses valid integers (including negatives and '-0')", () => {
    expect(parseIntStrict("0")).toBe(0);

    // JavaScript can produce negative zero. Accept either +0 or -0 for "-0".
    const z = parseIntStrict("-0");
    expect(Object.is(z, 0) || Object.is(z, -0)).toBe(true);

    expect(parseIntStrict("123")).toBe(123);
    expect(parseIntStrict("-456")).toBe(-456);
  });

  it("rejects non-integer formats", () => {
    const bad = ["1.0", "1e3", "abc", "+1", " 1", "1 "];
    for (const s of bad) {
      expect(() => parseIntStrict(s)).toThrow("Invalid integer");
    }
  });

  it("rejects out-of-range values", () => {
    // one above/below the safe integer range
    expect(() => parseIntStrict("9007199254740992")).toThrow("Out of range");
    expect(() => parseIntStrict("-9007199254740992")).toThrow("Out of range");
  });
});

/** isEmail */
describe("isEmail", () => {
  it("accepts simple valid addresses", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("local.part@sub.example-domain.com")).toBe(true);
  });

  it("rejects addresses without exactly one @ or with empty parts", () => {
    expect(isEmail("ab.co")).toBe(false);         // no @
    expect(isEmail("@example.com")).toBe(false);  // empty local
    expect(isEmail("a@")).toBe(false);            // empty domain
    expect(isEmail("a@@b.com")).toBe(false);      // multiple @
  });

  it("rejects invalid local part shapes", () => {
    expect(isEmail(".a@example.com")).toBe(false);     // leading dot
    expect(isEmail("a.@example.com")).toBe(false);     // trailing dot
    expect(isEmail("a..b@example.com")).toBe(false);   // double dot
  });

  it("enforces domain structure and label rules", () => {
    expect(isEmail("a@b")).toBe(false);                // no dot in domain
    expect(isEmail("a@.example.com")).toBe(false);     // dot at start
    expect(isEmail("a@example.com.")).toBe(false);     // dot at end
    expect(isEmail("a@exa..mple.com")).toBe(false);    // double dot
    expect(isEmail("a@-example.com")).toBe(false);     // label starts with hyphen
    expect(isEmail("a@example-.com")).toBe(false);     // label ends with hyphen
    expect(isEmail("a@exa_mple.com")).toBe(false);     // underscore not allowed in label
  });

  it("rejects whitespace or control characters anywhere", () => {
    expect(isEmail("a@exa mple.com")).toBe(false);
    expect(isEmail("a@\nexample.com")).toBe(false);
    expect(isEmail(" a@example.com")).toBe(false);
  });

  it("honors length limits for local, domain, and overall", () => {
    const local64 = "l".repeat(64);
    // Build a 255-char domain: four 63-char labels joined by three dots (63*4 + 3 = 255)
    const label63 = "d".repeat(63);
    const domain255 = [label63, label63, label63, label63].join(".");
    expect(domain255.length).toBe(255);

    const maxOk = `${local64}@${domain255}`;
    expect(maxOk.length).toBe(320);
    expect(isEmail(maxOk)).toBe(true);

    const local65 = "l".repeat(65);
    expect(isEmail(`${local65}@example.com`)).toBe(false);

    const domain256 = `${"d".repeat(64)}.${"d".repeat(64)}.${"d".repeat(64)}.${"d".repeat(64)}`; // 64*4 + 3 = 259
    expect(domain256.length).toBeGreaterThan(255);
    expect(isEmail(`a@${domain256}`)).toBe(false);
  });
});

/** isUuidV4 */
describe("isUuidV4", () => {
  it("accepts valid v4 UUIDs (any case)", () => {
    expect(isUuidV4("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
    expect(isUuidV4("F47AC10B-58CC-4372-A567-0E02B2C3D479")).toBe(true);
  });

  it("rejects other versions, variants, or malformed strings", () => {
    expect(isUuidV4("f47ac10b-58cc-1372-a567-0e02b2c3d479")).toBe(false); // version 1
    expect(isUuidV4("f47ac10b-58cc-4372-7567-0e02b2c3d479")).toBe(false); // bad variant
    expect(isUuidV4("not-a-uuid")).toBe(false);
    expect(isUuidV4("f47ac10b58cc4372a5670e02b2c3d479")).toBe(false);     // missing hyphens
  });
});
