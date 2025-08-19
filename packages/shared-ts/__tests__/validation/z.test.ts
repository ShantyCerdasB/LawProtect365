/**
 * @file z.test.ts
 * @summary Tests for the centralized Zod export with a shared error map.
 * @remarks
 * - Uses `jest.isolateModulesAsync` to confine the global `z.setErrorMap` side effect per test.
 * - Verifies standardized messages for core error codes and validations.
 * - Confirms Node fallback behavior for unmatched codes (default message).
 */

describe("validation/z (centralized Zod with custom error map)", () => {
  it("formats invalid_type as 'Expected <expected>, received <received>'", async () => {
    await jest.isolateModulesAsync(async () => {
      const { z } = await import("../../src/validation/z.js");
      const schema = z.object({ a: z.string() });
      const r = schema.safeParse({ a: 123 });
      expect(r.success).toBe(false);
      if (!r.success) {
        const msg = r.error.issues[0]?.message;
        expect(msg).toBe("Expected string, received number");
      }
    });
  });

  it("maps too_small to 'Value is too small'", async () => {
    await jest.isolateModulesAsync(async () => {
      const { z } = await import("../../src/validation/z.js");
      const r = z.string().min(3).safeParse("ab");
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0]?.message).toBe("Value is too small");
    });
  });

  it("maps too_big to 'Value is too large'", async () => {
    await jest.isolateModulesAsync(async () => {
      const { z } = await import("../../src/validation/z.js");
      const r = z.number().max(5).safeParse(10);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0]?.message).toBe("Value is too large");
    });
  });

  it("maps invalid_string: 'uuid' to 'Invalid UUID format'", async () => {
    await jest.isolateModulesAsync(async () => {
      const { z } = await import("../../src/validation/z.js");
      const r = z.string().uuid().safeParse("not-a-uuid");
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0]?.message).toBe("Invalid UUID format");
    });
  });

  it("maps invalid_string: 'email' to 'Invalid email address'", async () => {
    await jest.isolateModulesAsync(async () => {
      const { z } = await import("../../src/validation/z.js");
      const r = z.string().email().safeParse("bad@");
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0]?.message).toBe("Invalid email address");
    });
  });

  it("maps invalid_string (other validations, e.g., regex) to 'Invalid string format'", async () => {
    await jest.isolateModulesAsync(async () => {
      const { z } = await import("../../src/validation/z.js");
      const r = z.string().regex(/^\d+$/).safeParse("abc");
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0]?.message).toBe("Invalid string format");
    });
  });

  it("falls back to Zod default error for unhandled codes (e.g., custom refine)", async () => {
    await jest.isolateModulesAsync(async () => {
      const { z } = await import("../../src/validation/z.js");
      // Refine uses issue.code = "custom"; our map forwards ctx.defaultError.
      const r = z.string().refine(() => false).safeParse("x");
      expect(r.success).toBe(false);
      if (!r.success) {
        const msg = r.error.issues[0]?.message;
        // Default Zod message for custom failures is "Invalid input"
        expect(typeof msg).toBe("string");
        expect(msg.toLowerCase()).toContain("invalid");
      }
    });
  });
});
