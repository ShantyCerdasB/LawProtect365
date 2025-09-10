/**
 * @file sanitizers.test.ts
 * @summary Tests for Zod sanitizers: TrimmedString, NormalizedEmail, and CollapsedWhitespace.
 * @remarks
 * - Uses safeParse and inspects Zod issues to avoid brittle message matching.
 * - Exercises both preprocess branches (string vs non-string) and transform behavior.
 */

import {
  TrimmedString,
  NormalizedEmail,
  CollapsedWhitespace} from "../../src/validation/sanitizers.js";

describe("TrimmedString", () => {
  it("trims leading/trailing spaces and returns the trimmed value", () => {
    const res = TrimmedString.safeParse("  hello  ");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe("hello");
    }
  });

  it("rejects empty result after trim with custom message", () => {
    const res = TrimmedString.safeParse("   ");
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues[0];
      expect(issue.code).toBe("too_small");
      expect((issue as any).minimum).toBe(1);
      expect((issue as any).type).toBe("string");
      expect(issue.message).toBe("Required");
    }
  });

  it("rejects non-string inputs (type error before min check)", () => {
    const res = TrimmedString.safeParse(123 as any);
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues[0];
      expect(issue.code).toBe("invalid_type");
      expect((issue as any).expected).toBe("string");
      expect((issue as any).received).toBe("number");
    }
  });
});

describe("NormalizedEmail", () => {
  it("lowercases and trims a valid email", () => {
    const res = NormalizedEmail.safeParse("  USER+Tag@Example.COM  ");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe("user+tag@example.com");
    }
  });

  it("rejects invalid email strings with custom message", () => {
    const res = NormalizedEmail.safeParse("not-an-email");
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues[0];
      expect(issue.code).toBe("invalid_string");
      expect((issue as any).validation).toBe("email");
      expect(issue.message).toBe("Invalid email");
    }
  });

  it("rejects non-string inputs with type error (preprocess passes through)", () => {
    const res = NormalizedEmail.safeParse({} as any);
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues[0];
      expect(issue.code).toBe("invalid_type");
      expect((issue as any).expected).toBe("string");
      expect((issue as any).received).toBe("object");
    }
  });
});

describe("CollapsedWhitespace", () => {
  it("collapses inner whitespace to single spaces and trims ends", () => {
    const res = CollapsedWhitespace.safeParse("  a\t\tb  \n c   ");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe("a b c");
    }
  });

  it("returns empty string when input is only whitespace", () => {
    const res = CollapsedWhitespace.safeParse("   \n\t  ");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe("");
    }
  });

  it("rejects non-string inputs (type error before transform)", () => {
    const res = CollapsedWhitespace.safeParse(42 as any);
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues[0];
      expect(issue.code).toBe("invalid_type");
      expect((issue as any).expected).toBe("string");
      expect((issue as any).received).toBe("number");
    }
  });
});
