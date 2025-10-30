/**
 * @fileoverview Error propagation helpers for services and use cases
 * @summary Reusable helpers to preserve AppError semantics and wrap unknown errors
 * @description Provides small utilities to avoid duplicating try/catch boilerplate.
 */

import { AppError } from "./AppError.js";

export type FallbackFactory = (details?: unknown) => AppError<string>;

/**
 * Rethrows AppError as-is; wraps unknown errors with the given domain fallback factory.
 * Use inside catch blocks to avoid repeating error-shape checks.
 * @param err - Caught error
 * @param fallback - Factory producing a domain AppError (e.g., userUpdateFailed)
 * @throws AppError
 */
export function rethrowAppErrorOr(err: unknown, fallback: FallbackFactory): never {
  // Preserve domain errors
  if (err instanceof AppError) throw err;

  // Preserve provider errors that already carry API-friendly shape
  const anyErr = err as any;
  if (typeof anyErr?.statusCode === "number" && typeof anyErr?.code === "string") {
    throw anyErr;
  }

  // Wrap everything else in the provided domain error
  throw fallback({ cause: serializeUnknown(err) });
}

function serializeUnknown(err: unknown) {
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack };
  return { message: String(err) };
}


