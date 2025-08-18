import { z } from "zod";
import type { ApiEvent } from "@http/httpTypes.js";
import { validateJsonBody, validatePath, validateQuery } from "./http.js";

/**
 * High-level request validator composing path, query and body schemas.
 */

export interface RequestSchemas<P extends Record<string, unknown>, Q extends Record<string, unknown>, B> {
  path?: z.ZodType<P>;
  query?: z.ZodType<Q>;
  body?: z.ZodType<B>;
}

/**
 * Validates an API event against optional path, query and body schemas.
 * Returns a tuple with typed values.
 * @param evt API event.
 * @param schemas Object containing Zod schemas.
 */
export const validateRequest = <
  P extends Record<string, unknown> = Record<string, never>,
  Q extends Record<string, unknown> = Record<string, never>,
  B = unknown
>(
  evt: ApiEvent,
  schemas: RequestSchemas<P, Q, B>
): { path: P; query: Q; body: B } => {
  const path = schemas.path ? validatePath(evt, schemas.path) : ({} as P);
  const query = schemas.query ? validateQuery(evt, schemas.query) : ({} as Q);
  const body = schemas.body ? validateJsonBody(evt, schemas.body) : (undefined as unknown as B);
  return { path, query, body };
};
