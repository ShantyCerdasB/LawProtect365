/**
 * Optional value container.
 */
export type Maybe<T> = { readonly kind: "some"; readonly value: T } | { readonly kind: "none" };

/**
 * Creates a Some.
 * @param v Present value.
 */
export const some = <T>(v: T): Maybe<T> => ({ kind: "some", value: v });

/**
 * None singleton.
 */
export const none = <T = never>(): Maybe<T> => ({ kind: "none" });

/**
 * Lifts a nullable/undefined to Maybe.
 * @param v Possibly-null value.
 */
export const fromNullable = <T>(v: T | null | undefined): Maybe<T> =>
  v === null || v === undefined ? none<T>() : some(v);

/**
 * Maps a present value.
 * @param m Maybe input.
 * @param fn Transform function.
 */
export const map = <T, U>(m: Maybe<T>, fn: (v: T) => U): Maybe<U> =>
  m.kind === "some" ? some(fn(m.value)) : m;

/**
 * Unwraps or returns a default value.
 * @param m Maybe input.
 * @param fallback Default value.
 */
export const unwrapOr = <T>(m: Maybe<T>, fallback: T): T =>
  m.kind === "some" ? m.value : fallback;
