/**
 * @file Result.ts
 * @summary Discriminated union for success/failure with collision-safe helper names.
 */

export type Result<T, E = unknown> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Creates a successful result.
 *
 * @param value Payload for the success case.
 * @returns An `Ok` result.
 */
export const resultOk = <T>(value: T): Result<T, never> => ({ ok: true, value });

/**
 * Creates a failed result.
 *
 * @param error Error payload.
 * @returns An `Err` result.
 */
export const resultErr = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Transforms the value on success.
 *
 * @param r Input result.
 * @param fn Mapping function applied to `Ok` values.
 * @returns Mapped result or the original error.
 */
export const resultMap = <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> =>
  r.ok ? resultOk(fn(r.value)) : r;

/**
 * Transforms the error on failure.
 *
 * @param r Input result.
 * @param fn Mapping function applied to `Err` errors.
 * @returns Result with transformed error or the original success.
 */
export const resultMapErr = <T, E, F>(r: Result<T, E>, fn: (e: E) => F): Result<T, F> =>
  r.ok ? r : resultErr(fn(r.error));

/**
 * Chains computations that themselves return a `Result`.
 *
 * @param r Input result.
 * @param fn Continuation invoked on `Ok` values.
 * @returns The continuation output when `Ok`, otherwise the original `Err`.
 */
export const resultAndThen = <T, U, E>(
  r: Result<T, E>,
  fn: (v: T) => Result<U, E>
): Result<U, E> => (r.ok ? fn(r.value) : r);

/**
 * Extracts the success value or throws the error.
 *
 * @param r Input result.
 * @throws The `error` when `Err`.
 * @returns The contained value when `Ok`.
 */
export const resultUnwrap = <T, E>(r: Result<T, E>): T => {
  if (r.ok) return r.value;
  throw r.error;
};

/**
 * Extracts the value or returns a fallback for failures.
 *
 * @param r Input result.
 * @param fallback Default value when `Err`.
 * @returns The value on success, otherwise `fallback`.
 */
export const resultUnwrapOr = <T, E>(r: Result<T, E>, fallback: T): T =>
  r.ok ? r.value : fallback;
