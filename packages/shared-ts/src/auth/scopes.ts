/**
 * OAuth2 scope utilities.
 */

/**
 * Normalizes a space-delimited scope string into an array.
 * @param v Space-delimited scope string.
 * @returns Array of scopes.
 */
export const parseScopes = (v: string | undefined): string[] =>
  v ? v.split(" ").map((s) => s.trim()).filter(Boolean) : [];

/**
 * Checks that all required scopes are present.
 * @param available Scopes the subject has.
 * @param required Scopes required to pass.
 */
export const hasAllScopes = (available: string[] | undefined, required: string[]): boolean => {
  const set = new Set(available ?? []);
  return required.every((s) => set.has(s));
};

/**
 * Checks that at least one of the scopes is present.
 * @param available Scopes the subject has.
 * @param anyOf Scopes of which at least one must be present.
 */
export const hasAnyScope = (available: string[] | undefined, anyOf: string[]): boolean => {
  const set = new Set(available ?? []);
  return anyOf.some((s) => set.has(s));
};
