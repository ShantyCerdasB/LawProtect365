/**
 * @file pagination.test.ts
 * @summary Tests for pagination helpers: `paginationQuerySchema` and `parsePaginationQuery`.
 * @remarks
 * - Verifies coercion, defaults, bounds, and fallback behavior.
 * - Uses a minimal event shape; only `queryStringParameters` is read by the implementation.
 */

import {
  paginationQuerySchema,
  parsePaginationQuery} from "../../src/validation/pagination.js";

/** A minimal event shape for tests (only what the code reads). */
type MiniEvent = { queryStringParameters?: Record<string, string | undefined> };

describe("validation/pagination", () => {
  describe("paginationQuerySchema()", () => {
    it("applies default limit = min(50, maxDefault) when missing", () => {
      const s1 = paginationQuerySchema(); // maxDefault = 100
      const r1 = s1.safeParse({});
      expect(r1.success).toBe(true);
      if (r1.success) expect(r1.data.limit).toBe(50);

      const s2 = paginationQuerySchema(20);
      const r2 = s2.safeParse({});
      expect(r2.success).toBe(true);
      if (r2.success) expect(r2.data.limit).toBe(20);
    });

    it("coerces string/number and enforces integer, positive, and max", () => {
      const s = paginationQuerySchema(100);

      // String → number, valid
      const ok = s.safeParse({ limit: "25", cursor: "abc" });
      expect(ok.success).toBe(true);
      if (ok.success) {
        expect(ok.data.limit).toBe(25);
        expect(ok.data.cursor).toBe("abc");
      }

      // Non-integer -> fails
      expect(s.safeParse({ limit: 25.5 }).success).toBe(false);

      // Non-positive -> fails
      expect(s.safeParse({ limit: "-3" }).success).toBe(false);

      // Above max -> fails
      expect(s.safeParse({ limit: "200" }).success).toBe(false);

      // Empty cursor -> fails (min(1))
      expect(s.safeParse({ limit: "10", cursor: "" }).success).toBe(false);
    });
  });

  describe("parsePaginationQuery()", () => {
    it("returns default when queryStringParameters is missing", () => {
      const evt: MiniEvent = {};
      const out = parsePaginationQuery(evt as any); // maxDefault = 100 → default 50
      expect(out).toEqual({ limit: 50 });
    });

    it("parses valid limit and cursor from strings", () => {
      const evt: MiniEvent = { queryStringParameters: { limit: "30", cursor: "xyz" } };
      const out = parsePaginationQuery(evt as any);
      expect(out).toEqual({ limit: 30, cursor: "xyz" });
    });

    it("caps the default when maxDefault < 50", () => {
      const evt: MiniEvent = {}; // no params → use default
      const out = parsePaginationQuery(evt as any, 20);
      expect(out).toEqual({ limit: 20 });
    });

    it("falls back to default when validation fails (invalid limit)", () => {
      const evt: MiniEvent = { queryStringParameters: { limit: "-5" } }; // not positive
      const out = parsePaginationQuery(evt as any);
      expect(out).toEqual({ limit: 50 });
    });

    it("falls back when limit exceeds maxDefault", () => {
      const evt: MiniEvent = { queryStringParameters: { limit: "99" } };
      // With maxDefault = 20, schema `.max(20)` fails → fallback default = 20
      const out = parsePaginationQuery(evt as any, 20);
      expect(out).toEqual({ limit: 20 });
    });

    it("falls back when cursor is empty (violates min(1))", () => {
      const evt: MiniEvent = { queryStringParameters: { cursor: "" } };
      const out = parsePaginationQuery(evt as any);
      expect(out).toEqual({ limit: 50 }); // cursor dropped by fallback
    });
  });
});
