/**
 * @file commonSchemas.test.ts
 * @summary Tests for common Zod schemas: NonEmptyStringSchema, SafeStringSchema, ISODateStringSchema, EmailStringSchema, PositiveIntSchema, JsonUnknownSchema, JsonObjectSchema.
 */

import {
  NonEmptyStringSchema,
  SafeStringSchema,
  ISODateStringSchema,
  EmailStringSchema,
  PositiveIntSchema,
  JsonUnknownSchema,
  JsonObjectSchema} from "../../src/validation";

describe("validation/schemas", () => {
  describe("NonEmptyStringSchema", () => {
    it("accepts non-empty strings", () => {
      expect(NonEmptyStringSchema.parse("a")).toBe("a");
      expect(NonEmptyStringSchema.parse("  x")).toBe("  x");
    });

    it("rejects empty strings with message 'Required'", () => {
      const r = NonEmptyStringSchema.safeParse("");
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0]?.message).toBe("Required");
    });
  });

  describe("SafeStringSchema", () => {
    it("accepts strings without ASCII control characters", () => {
      expect(SafeStringSchema.parse("hello")).toBe("hello");
      expect(SafeStringSchema.parse("line—ok_123")).toBe("line—ok_123");
    });

    it("rejects strings containing control chars (U+0000–U+001F or U+007F)", () => {
      for (const s of ["bad\u0000", "\u001Fbad", "bad\u007Fend"]) {
        const r = SafeStringSchema.safeParse(s);
        expect(r.success).toBe(false);
        if (!r.success) expect(r.error.issues[0]?.message).toBe("Control characters not allowed");
      }
    });
  });

  describe("ISODateStringSchema", () => {
    it("accepts ISO-like date/time strings parseable by Date.parse", () => {
      expect(ISODateStringSchema.parse("2020-01-01T00:00:00.000Z")).toBe("2020-01-01T00:00:00.000Z");
      expect(ISODateStringSchema.parse("2025-08-18")).toBe("2025-08-18");
    });

    it("rejects non-parseable strings with message 'Invalid ISO-8601 timestamp'", () => {
      for (const s of ["not-a-date", "2020-13-01", "2020-02-30T25:61:61Z"]) {
        const r = ISODateStringSchema.safeParse(s);
        expect(r.success).toBe(false);
        if (!r.success) expect(r.error.issues[0]?.message).toBe("Invalid ISO-8601 timestamp");
      }
    });
  });

  describe("EmailStringSchema", () => {
    it("accepts valid email strings", () => {
      expect(EmailStringSchema.parse("a@b.co")).toBe("a@b.co");
      expect(EmailStringSchema.parse("user.name+tag@sub.example.com")).toBe("user.name+tag@sub.example.com");
    });

    it("rejects invalid emails with message 'Invalid email'", () => {
      for (const s of ["", "plain", "a@b", "a@b.", "a @b.com"]) {
        const r = EmailStringSchema.safeParse(s);
        expect(r.success).toBe(false);
        if (!r.success) expect(r.error.issues[0]?.message).toBe("Invalid email");
      }
    });
  });

  describe("PositiveIntSchema", () => {
    it("accepts positive safe integers", () => {
      expect(PositiveIntSchema.parse(1)).toBe(1);
      expect(PositiveIntSchema.parse(123456)).toBe(123456);
    });

    it("rejects zero, negatives, and non-integers", () => {
      for (const v of [0, -1, 1.5, NaN, Infinity, -Infinity]) {
        const r = PositiveIntSchema.safeParse(v as number);
        expect(r.success).toBe(false);
      }
    });
  });

  describe("JsonUnknownSchema", () => {
    it("accepts any value and returns it unchanged", () => {
      expect(JsonUnknownSchema.parse(42)).toBe(42);
      const obj = { a: 1, b: [2, 3] };
      expect(JsonUnknownSchema.parse(obj)).toBe(obj);
      expect(JsonUnknownSchema.parse(null)).toBeNull();
    });
  });

  describe("JsonObjectSchema", () => {
    it("defaults to an empty object when input is undefined", () => {
      const r = JsonObjectSchema.parse(undefined);
      expect(r).toEqual({});
    });

    it("accepts records with arbitrary values", () => {
      const o = { a: 1, b: "x", c: true, d: null, e: { nested: 1 } };
      expect(JsonObjectSchema.parse(o)).toEqual(o);
    });

    it("rejects non-object inputs", () => {
      for (const v of [null, 1, "x", true]) {
        const r = JsonObjectSchema.safeParse(v as any);
        expect(r.success).toBe(false);
      }
    });
  });
});
