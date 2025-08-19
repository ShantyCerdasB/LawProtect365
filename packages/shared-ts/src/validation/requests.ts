import { z } from "zod";
import type { ApiEvent } from "@http/httpTypes.js";
import { validateJsonBody, validatePath, validateQuery } from "./http.js";

/**
 * Composable request validator for path, query, and JSON body.
 * @remarks
 * - Accepts any Zod schema and returns `z.infer<S>` so transforms/pipes are preserved.
 * - Keeps branching minimal to satisfy common Sonar complexity thresholds.
 */

/** Zod schemas for a request; each field is optional. */
export interface RequestSchemas<
  SP extends z.ZodTypeAny | undefined = undefined,
  SQ extends z.ZodTypeAny | undefined = undefined,
  SB extends z.ZodTypeAny | undefined = undefined
> {
  /** Schema for path parameters. */
  path?: SP;
  /** Schema for query parameters. */
  query?: SQ;
  /** Schema for JSON body. */
  body?: SB;
}

/** Utility to infer type from schema or fall back to a default. */
type InferOr<TSchema, TFallback> =
  TSchema extends z.ZodTypeAny ? z.infer<TSchema> : TFallback;

/**
 * Validates an API event with optional path, query, and body schemas.
 * @param evt - API event.
 * @param schemas - Object containing optional Zod schemas.
 * @returns Typed tuple `{ path, query, body }`, using defaults when a schema is omitted:
 * - `path`: `{}` if no schema.
 * - `query`: `{}` if no schema.
 * - `body`: `undefined` if no schema.
 */
export const validateRequest = <
  SP extends z.ZodTypeAny | undefined = undefined,
  SQ extends z.ZodTypeAny | undefined = undefined,
  SB extends z.ZodTypeAny | undefined = undefined
>(
  evt: ApiEvent,
  schemas: RequestSchemas<SP, SQ, SB>
): {
  path: InferOr<SP, Record<string, never>>;
  query: InferOr<SQ, Record<string, never>>;
  body: InferOr<SB, undefined>;
} => {
  const path = (schemas.path
    ? validatePath(evt, schemas.path)
    : ({} as Record<string, never>)) as InferOr<SP, Record<string, never>>;

  const query = (schemas.query
    ? validateQuery(evt, schemas.query)
    : ({} as Record<string, never>)) as InferOr<SQ, Record<string, never>>;

  const body = (schemas.body
    ? validateJsonBody(evt, schemas.body)
    : (undefined as undefined)) as InferOr<SB, undefined>;

  return { path, query, body };
};
