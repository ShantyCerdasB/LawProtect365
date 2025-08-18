/**
 * Discriminated union for success/failure results.
 */
export type Result<T, E = unknown> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Creates an Ok result.
 * @param value Successful payload.
 */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/**
 * Creates an Err result.
 * @param error Failure payload.
 */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Maps a successful result.
 * @param r Input result.
 * @param fn Transform applied to Ok values.
 */
export const map = <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> =>
  r.ok ? ok(fn(r.value)) : r;

/**
 * Maps an error result.
 * @param r Input result.
 * @param fn Transform applied to Err values.
 */
export const mapErr = <T, E, F>(r: Result<T, E>, fn: (e: E) => F): Result<T, F> =>
  r.ok ? r : err(fn(r.error));

/**
 * Chains computations that return Result.
 * @param r Input result.
 * @param fn Continuation for Ok values.
 */
export const andThen = <T, U, E>(r: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> =>
  r.ok ? fn(r.value) : r;

/**
 * Unwraps a result or throws on error.
 * @param r Input result.
 */
export const unwrap = <T, E>(r: Result<T, E>): T => {
  if (r.ok) return r.value;
  throw r.error;
};

/**
 * Unwraps a result or returns a default value.
 * @param r Input result.
 * @param fallback Default value when Err.
 */
export const unwrapOr = <T, E>(r: Result<T, E>, fallback: T): T => (r.ok ? r.value : fallback);
