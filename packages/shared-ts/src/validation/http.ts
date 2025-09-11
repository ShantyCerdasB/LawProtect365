import { z } from "zod";
import type { ApiEvent } from "../http/httpTypes.js";
import { AppError } from "../errors/AppError.js";
import { ErrorCodes } from "../errors/codes.js";

/**
 * HTTP request validation helpers for path parameters, query string, and JSON body.
 * @remarks
 * - Accept any Zod schema (<S extends z.ZodTypeAny>) and return z.infer<S> to preserve transforms/pipes.
 * - Uses simple branching to keep cognitive complexity low.
 */

/**
 * Validates and returns typed path parameters.
 * @param evt - API event.
 * @param schema - Zod schema for params (input and output may differ).
 * @returns Parsed params inferred from the schema.
 * @throws AppError 400 when validation fails.
 */
export const validatePath = <S extends z.ZodTypeAny>(
  evt: ApiEvent,
  schema: S
): z.infer<S> => {
  const input = { ...(evt.pathParameters ?? {}) } as Record<string, unknown>;
  const out = schema.safeParse(input);
  if (!out.success) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      "Invalid path parameters",
      { issues: out.error.issues }
    );
  }
  return out.data as z.infer<S>;
};

/**
 * Validates and returns typed query parameters.
 * @param evt - API event.
 * @param schema - Zod schema for query string (input and output may differ).
 * @returns Parsed query object inferred from the schema.
 * @throws AppError 400 when validation fails.
 */
export const validateQuery = <S extends z.ZodTypeAny>(
  evt: ApiEvent,
  schema: S
): z.infer<S> => {
  const src = evt.queryStringParameters ?? {};
  const normalized = Object.fromEntries(Object.entries(src));
  const out = schema.safeParse(normalized);
  if (!out.success) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      "Invalid query parameters",
      { issues: out.error.issues }
    );
  }
  return out.data as z.infer<S>;
};

/**
 * Validates and returns a typed JSON body. Supports strict base64-encoded payloads.
 * @param evt - API event.
 * @param schema - Zod schema for the body (input and output may differ).
 * @returns Parsed body inferred from the schema.
 * @throws AppError 400 when the body is missing, encoding is invalid, or JSON fails to parse.
 * @throws AppError 422 when schema validation fails.
 */
export const validateJsonBody = <S extends z.ZodTypeAny>(
  evt: ApiEvent,
  schema: S
): z.infer<S> => {
  if (!evt.body) {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, "Empty request body");
  }

  let raw: string;

  if (evt.isBase64Encoded) {
    // Strict base64 check: alphabet and length multiple of 4 (no whitespace).
    const s = String(evt.body);
    const base64Pattern = /^[A-Za-z0-9+/=]*$/;
    if (s.length === 0 || s.length % 4 !== 0 || !base64Pattern.test(s)) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        "Invalid body encoding"
      );
    }
    try {
      raw = Buffer.from(s, "base64").toString("utf8");
    } catch {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        "Invalid body encoding"
      );
    }
  } else {
    raw = String(evt.body);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
    
    // Fix: If the result is still a string, parse it again (double JSON encoding)
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }
  } catch (error) {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, "Invalid JSON");
  }

  const out = schema.safeParse(json);
  if (!out.success) {
    console.log('Schema validation failed:', {
      json,
      issues: out.error.issues,
      schemaName: schema._def?.typeName || 'unknown'
    });
    throw new AppError(
      ErrorCodes.COMMON_UNPROCESSABLE_ENTITY,
      422,
      "Unprocessable Entity",
      { issues: out.error.issues }
    );
  }
  return out.data as z.infer<S>;
};
