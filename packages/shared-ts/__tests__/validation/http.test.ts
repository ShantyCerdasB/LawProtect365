/**
 * @file http.test.ts
 * @summary Tests for HTTP validation helpers: path params, query string, and JSON body.
 * @remarks
 * - Mocks `@errors/AppError.js` and `@errors/codes.js` so we can assert error shape without external coupling.
 * - Exercises success and failure branches, including base64 decoding and JSON parse errors.
 */

import { z } from "zod";

/** Minimal mock matching the AppError constructor used by the SUT. */
class MockAppError extends Error {
  /** Application error code. */
  public code: string;
  /** HTTP status code (also exposed as httpStatus). */
  public status: number;
  public httpStatus: number;
  /** Optional metadata payload (e.g., Zod issues). */
  public meta?: unknown;

  constructor(code: string, status: number, message: string, meta?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.httpStatus = status;
    this.meta = meta;
  }
}

// Mock project-level error modules BEFORE importing the SUT.
jest.doMock("@errors/AppError.js", () => ({ AppError: MockAppError }));
jest.doMock("@errors/codes.js", () => ({
  ErrorCodes: {
    COMMON_BAD_REQUEST: "COMMON_BAD_REQUEST",
    COMMON_UNPROCESSABLE_ENTITY: "COMMON_UNPROCESSABLE_ENTITY",
  },
}));

// Bindings with accurate types: accept any Zod schema and return z.infer<S>.
let validatePath: <S extends z.ZodTypeAny>(evt: any, schema: S) => z.infer<S>;
let validateQuery: <S extends z.ZodTypeAny>(evt: any, schema: S) => z.infer<S>;
let validateJsonBody: <S extends z.ZodTypeAny>(evt: any, schema: S) => z.infer<S>;

beforeAll(async () => {
  await jest.isolateModulesAsync(async () => {
    const mod = await import("../../src/validation/http.js");
    validatePath = mod.validatePath;
    validateQuery = mod.validateQuery;
    validateJsonBody = mod.validateJsonBody;
  });
});

/**
 * Creates a minimal API event object with convenient overrides.
 * Only includes fields used by the SUT.
 */
const mkEvt = (overrides: Partial<{
  pathParameters: Record<string, string | undefined> | null;
  queryStringParameters: Record<string, string | undefined> | null;
  body: unknown;
  isBase64Encoded: boolean;
}> = {}) => ({
  pathParameters: undefined,
  queryStringParameters: undefined,
  body: undefined,
  isBase64Encoded: false,
  ...overrides,
});

describe("validatePath()", () => {
  it("returns typed params on success", () => {
    const schema = z.object({ id: z.string().uuid() });
    const evt = mkEvt({ pathParameters: { id: "11111111-2222-4333-8444-555555555555" } });
    const out = validatePath(evt as any, schema);
    expect(out).toEqual({ id: "11111111-2222-4333-8444-555555555555" });
  });

  it("throws AppError 400 on invalid params", () => {
    const schema = z.object({ id: z.string().uuid() });
    const evt = mkEvt({ pathParameters: { id: "not-a-uuid" } });

    try {
      validatePath(evt as any, schema);
      throw new Error("expected throw");
    } catch (err: any) {
      expect(err).toBeInstanceOf(MockAppError);
      expect(err.code).toBe("COMMON_BAD_REQUEST");
      expect(err.httpStatus).toBe(400);
      expect(String(err.message)).toMatch(/Invalid path parameters/i);
      expect(err.meta?.issues?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe("validateQuery()", () => {
  it("returns typed query on success (with transform)", () => {
    const schema = z.object({
      q: z.string().optional(),
      page: z
        .string()
        .default("1")
        .transform((s) => Number(s))
        .pipe(z.number().int().min(1)),
    });

    const evt = mkEvt({ queryStringParameters: { q: "hello", page: "3" } });
    const out = validateQuery(evt as any, schema);
    expect(out).toEqual({ q: "hello", page: 3 });
  });

  it("throws AppError 400 on invalid query", () => {
    const schema = z.object({
      page: z.string().regex(/^\d+$/), // must be numeric
    });
    const evt = mkEvt({ queryStringParameters: { page: "abc" } });

    try {
      validateQuery(evt as any, schema);
      throw new Error("expected throw");
    } catch (err: any) {
      expect(err).toBeInstanceOf(MockAppError);
      expect(err.code).toBe("COMMON_BAD_REQUEST");
      expect(err.httpStatus).toBe(400);
      expect(String(err.message)).toMatch(/Invalid query parameters/i);
      expect(err.meta?.issues?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe("validateJsonBody()", () => {
  it("parses a plain JSON body and returns typed output", () => {
    const schema = z.object({ name: z.string(), age: z.number().int().min(0) });
    const evt = mkEvt({ body: JSON.stringify({ name: "Ana", age: 30 }) });
    const out = validateJsonBody(evt as any, schema);
    expect(out).toEqual({ name: "Ana", age: 30 });
  });

  it("decodes base64-encoded JSON body", () => {
    const schema = z.object({ ping: z.literal("pong") });
    const raw = JSON.stringify({ ping: "pong" });
    const evt = mkEvt({
      body: Buffer.from(raw, "utf8").toString("base64"),
      isBase64Encoded: true,
    });
    const out = validateJsonBody(evt as any, schema);
    expect(out).toEqual({ ping: "pong" });
  });

  it("throws 400 on empty body", () => {
    const schema = z.object({ any: z.string() });
    const evt = mkEvt({ body: undefined });

    expect(() => validateJsonBody(evt as any, schema)).toThrow(MockAppError);
    try {
      validateJsonBody(evt as any, schema);
    } catch (err: any) {
      expect(err.code).toBe("COMMON_BAD_REQUEST");
      expect(err.httpStatus).toBe(400);
      expect(String(err.message)).toMatch(/Empty request body/i);
    }
  });

  it("throws 400 on invalid base64 encoding", () => {
    const schema = z.object({ ok: z.boolean() });
    // Force Buffer.from to throw by passing a non-string as body when expecting base64 string.
    const evt = mkEvt({ body: 123 as any, isBase64Encoded: true });

    expect(() => validateJsonBody(evt as any, schema)).toThrow(MockAppError);
    try {
      validateJsonBody(evt as any, schema);
    } catch (err: any) {
      expect(err.code).toBe("COMMON_BAD_REQUEST");
      expect(err.httpStatus).toBe(400);
      expect(String(err.message)).toMatch(/Invalid body encoding/i);
    }
  });

  it("throws 400 on invalid JSON", () => {
    const schema = z.object({ ok: z.boolean() });
    const evt = mkEvt({ body: "{not-json" });

    expect(() => validateJsonBody(evt as any, schema)).toThrow(MockAppError);
    try {
      validateJsonBody(evt as any, schema);
    } catch (err: any) {
      expect(err.code).toBe("COMMON_BAD_REQUEST");
      expect(err.httpStatus).toBe(400);
      expect(String(err.message)).toMatch(/Invalid JSON/i);
    }
  });

  it("throws 422 on schema validation failure with issues", () => {
    const schema = z.object({ name: z.string().min(1) });
    const evt = mkEvt({ body: JSON.stringify({ name: "" }) }); // invalid per schema

    expect(() => validateJsonBody(evt as any, schema)).toThrow(MockAppError);
    try {
      validateJsonBody(evt as any, schema);
    } catch (err: any) {
      expect(err.code).toBe("COMMON_UNPROCESSABLE_ENTITY");
      expect(err.httpStatus).toBe(422);
      expect(String(err.message)).toMatch(/Unprocessable Entity/i);
      expect(err.meta?.issues?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
