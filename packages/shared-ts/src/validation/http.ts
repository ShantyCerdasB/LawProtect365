import { z } from "zod";
import type { ApiEvent } from "@http/httpTypes.js";
import { AppError } from "@errors/AppError.js";
import { ErrorCodes } from "@errors/codes.js";

/**
 * HTTP request validation helpers for path params, query and JSON body.
 */

/**
 * Validates and returns typed path params.
 * @param evt API event.
 * @param schema Zod schema for params.
 */
export const validatePath = <T extends Record<string, unknown>>(
  evt: ApiEvent,
  schema: z.ZodType<T>
): T => {
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
  return out.data;
};

/**
 * Validates and returns typed query params.
 * @param evt API event.
 * @param schema Zod schema for query string.
 */
export const validateQuery = <T extends Record<string, unknown>>(
  evt: ApiEvent,
  schema: z.ZodType<T>
): T => {
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
  return out.data;
};

/**
 * Validates and returns a typed JSON body.
 * Handles base64-encoded bodies.
 * @param evt API event.
 * @param schema Zod schema for the body.
 */
export const validateJsonBody = <T>(
  evt: ApiEvent,
  schema: z.ZodType<T>
): T => {
  if (!evt.body) {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, "Empty request body");
  }
  let raw: string;
  try {
    raw = evt.isBase64Encoded ? Buffer.from(evt.body, "base64").toString("utf8") : evt.body;
  } catch {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, "Invalid body encoding");
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, "Invalid JSON");
  }
  const out = schema.safeParse(json);
  if (!out.success) {
    throw new AppError(
      ErrorCodes.COMMON_UNPROCESSABLE_ENTITY,
      422,
      "Unprocessable Entity",
      { issues: out.error.issues }
    );
  }
  return out.data;
};
