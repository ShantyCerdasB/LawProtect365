/**
 * @file request.test.ts
 * @summary Tests for the composite request validator.
 * @remarks
 * - Mocks project error modules so thrown errors have a stable shape.
 * - Covers: full success (with transforms), defaults when schemas are omitted, and error bubbling.
 */

import { z } from "zod";

// Minimal AppError mock used by underlying validators.
class MockAppError extends Error {
  public code: string;
  public status: number;
  public httpStatus: number;
  public meta?: unknown;

  constructor(code: string, status: number, message: string, meta?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.httpStatus = status;
    this.meta = meta;
  }
}

jest.doMock("@errors/AppError.js", () => ({ AppError: MockAppError }));
jest.doMock("@errors/codes.js", () => ({
  ErrorCodes: {
    COMMON_BAD_REQUEST: "COMMON_BAD_REQUEST",
    COMMON_UNPROCESSABLE_ENTITY: "COMMON_UNPROCESSABLE_ENTITY",
  },
}));

let validateRequest: typeof import("../../src/validation/requests.js").validateRequest;

beforeAll(async () => {
  await jest.isolateModulesAsync(async () => {
    // Ensure the underlying http validators import the mocked error modules.
    const mod = await import("../../src/validation/requests.js");
    validateRequest = mod.validateRequest;
  });
});

/** Minimal event builder with only fields used by the validators. */
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

describe("validateRequest()", () => {
  it("validates path, query (with transforms), and body", () => {
    const schemas = {
      path: z.object({ id: z.string().uuid() }),
      query: z.object({
        q: z.string().optional(),
        page: z
          .string()
          .default("1")
          .transform((s) => Number(s))
          .pipe(z.number().int().min(1)),
      }),
      body: z.object({ name: z.string().min(1), age: z.number().int().min(0) }),
    };

    const evt = mkEvt({
      pathParameters: { id: "11111111-2222-4333-8444-555555555555" },
      queryStringParameters: { q: "hello", page: "3" },
      body: JSON.stringify({ name: "Ana", age: 30 }),
    });

    const out = validateRequest(evt as any, schemas);
    expect(out.path).toEqual({ id: "11111111-2222-4333-8444-555555555555" });
    expect(out.query).toEqual({ q: "hello", page: 3 });
    expect(out.body).toEqual({ name: "Ana", age: 30 });
  });

  it("returns sensible defaults when schemas are omitted", () => {
    const evt = mkEvt(); // no path/query/body
    const out = validateRequest(evt as any, {}); // all optional
    expect(out.path).toEqual({});
    expect(out.query).toEqual({});
    expect(out.body).toBeUndefined();
  });

  // Helper function to test validation errors
  const testValidationError = (
    testName: string,
    schemas: any,
    eventOverrides: any,
    expectedCode: string,
    expectedStatus: number,
    expectedMessagePattern: RegExp
  ) => {
    it(testName, () => {
      const evt = mkEvt(eventOverrides);
      expect(() => validateRequest(evt as any, schemas)).toThrow(MockAppError);
      try {
        validateRequest(evt as any, schemas);
      } catch (err: any) {
        expect(err.code).toBe(expectedCode);
        expect(err.httpStatus).toBe(expectedStatus);
        expect(String(err.message)).toMatch(expectedMessagePattern);
      }
    });
  };

  testValidationError(
    "bubbles path validation errors (400)",
    { path: z.object({ id: z.string().uuid() }) },
    { pathParameters: { id: "not-a-uuid" } },
    "COMMON_BAD_REQUEST",
    400,
    /Invalid path parameters/i
  );

  testValidationError(
    "bubbles query validation errors (400)",
    { query: z.object({ page: z.string().regex(/^\d+$/) }) },
    { queryStringParameters: { page: "abc" } },
    "COMMON_BAD_REQUEST",
    400,
    /Invalid query parameters/i
  );

  testValidationError(
    "bubbles body validation errors (422)",
    { body: z.object({ name: z.string().min(1) }) },
    { body: JSON.stringify({ name: "" }) },
    "COMMON_UNPROCESSABLE_ENTITY",
    422,
    /Unprocessable Entity/i
  );
});
