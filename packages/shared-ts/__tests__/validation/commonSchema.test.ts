/**
 * @file commonSchemas.test.ts
 * @summary Tests for common Zod schemas: NonEmptyString, SafeString, ISODateString, EmailString, PositiveInt, JsonUnknown, JsonObject.
 * @remarks
 * - Verifies success and failure paths, including custom error messages where defined.
 * - Keeps assertions minimal and focused on the documented behavior.
 */

import {
  NonEmptyString,
  SafeString,
  ISODateString,
  EmailString,
  PositiveInt,
  JsonUnknown,
  JsonObject,
} from "../../src/validation/commonSchemas";

describe("validation/schemas", () => {
  describe("NonEmptyString", () => {
    it("accepts non-empty strings", () => {
      expect(NonEmptyString.parse("a")).toBe("a");
      expect(NonEmptyString.parse("  x")).toBe("  x");
    });

    it("rejects empty strings with message 'Required'", () => {
      const r = NonEmptyString.safeParse("");
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0]?.message).toBe("Required");
    });
  });

  describe("SafeString", () => {
    it("accepts strings without ASCII control characters", () => {
      expect(SafeString.parse("hello")).toBe("hello");
      expect(SafeString.parse("line—ok_123")).toBe("line—ok_123");
    });

    it("rejects strings containing control chars (U+0000–U+001F or U+007F)", () => {
      for (const s of ["bad\u0000", "\u001Fbad", "bad\u007Fend"]) {
        const r = SafeString.safeParse(s);
        expect(r.success).toBe(false);
        if (!r.success) expect(r.error.issues[0]?.message).toBe("Control characters not allowed");
      }
    });
  });

  describe("ISODateString", () => {
    it("accepts ISO-ish date/time strings parseable by Date.parse", () => {
      // Full timestamp with Z
      expect(ISODateString.parse("2020-01-01T00:00:00.000Z")).toBe("2020-01-01T00:00:00.000Z");
      // Date-only is parseable by Date.parse in JS engines
      expect(ISODateString.parse("2025-08-18")).toBe("2025-08-18");
    });

    it("rejects non-parseable strings with message 'Invalid ISO-8601 timestamp'", () => {
      for (const s of ["not-a-date", "2020-13-01", "2020-02-30T25:61:61Z"]) {
        const r = ISODateString.safeParse(s);
        expect(r.success).toBe(false);
        if (!r.success) expect(r.error.issues[0]?.message).toBe("Invalid ISO-8601 timestamp");
      }
    });
  });

  describe("EmailString", () => {
    it("accepts valid email strings", () => {
      expect(EmailString.parse("a@b.co")).toBe("a@b.co");
      expect(EmailString.parse("user.name+tag@sub.example.com")).toBe("user.name+tag@sub.example.com");
    });

    it("rejects invalid emails with message 'Invalid email'", () => {
      for (const s of ["", "plain", "a@b", "a@b.", "a @b.com"]) {
        const r = EmailString.safeParse(s);
        expect(r.success).toBe(false);
        if (!r.success) expect(r.error.issues[0]?.message).toBe("Invalid email");
      }
    });
  });

  describe("PositiveInt", () => {
    it("accepts positive safe integers", () => {
      expect(PositiveInt.parse(1)).toBe(1);
      expect(PositiveInt.parse(123456)).toBe(123456);
    });

    it("rejects zero, negatives, and non-integers", () => {
      for (const v of [0, -1, 1.5, NaN, Infinity, -Infinity]) {
        const r = PositiveInt.safeParse(v as number);
        expect(r.success).toBe(false);
      }
    });
  });

  describe("JsonUnknown", () => {
    it("accepts any value and returns it unchanged", () => {
      expect(JsonUnknown.parse(42)).toBe(42);
      const obj = { a: 1, b: [2, 3] };
      expect(JsonUnknown.parse(obj)).toBe(obj);
      expect(JsonUnknown.parse(null)).toBeNull();
    });
  });

  describe("JsonObject", () => {
    it("defaults to an empty object when input is undefined", () => {
      const r = JsonObject.parse(undefined);
      expect(r).toEqual({});
    });

    it("accepts records with arbitrary values", () => {
      const o = { a: 1, b: "x", c: true, d: null, e: { nested: 1 } };
      expect(JsonObject.parse(o)).toEqual(o);
    });

    it("rejects non-object inputs", () => {
      for (const v of [null, 1, "x", true]) {
        const r = JsonObject.safeParse(v as any);
        expect(r.success).toBe(false);
      }
    });
  });
});
