/**
 * @file Maybe.ts
 * @summary Functional optional container with collision-safe helper names.
 */

export type Maybe<T> =
  | { readonly kind: "some"; readonly value: T }
  | { readonly kind: "none" };

/**
 * Creates a present value container.
 *
 * @param value Value to wrap.
 * @returns A `Maybe<T>` representing presence.
 */
export const maybeSome = <T>(value: T): Maybe<T> => ({ kind: "some", value });

/**
 * Creates an absent value container.
 *
 * @returns A `Maybe<T>` representing absence.
 */
export const maybeNone = <T = never>(): Maybe<T> => ({ kind: "none" });

/**
 * Lifts a nullable/undefined value into a `Maybe<T>`.
 *
 * @param value Possibly-null input.
 * @returns `maybeSome(value)` when defined, otherwise `maybeNone()`.
 */
export const maybeFromNullable = <T>(value: T | null | undefined): Maybe<T> =>
  value === null || value === undefined ? maybeNone<T>() : maybeSome(value);

/**
 * Applies a transformation when the value is present.
 *
 * @param m Input maybe.
 * @param fn Mapping function for present values.
 * @returns Transformed maybe or the original `none`.
 */
export const maybeMap = <T, U>(m: Maybe<T>, fn: (v: T) => U): Maybe<U> =>
  m.kind === "some" ? maybeSome(fn(m.value)) : m;

/**
 * Extracts the present value or returns a fallback.
 *
 * @param m Input maybe.
 * @param fallback Default value when absent.
 * @returns The contained value or the provided fallback.
 */
export const maybeUnwrapOr = <T>(m: Maybe<T>, fallback: T): T =>
  m.kind === "some" ? m.value : fallback;
