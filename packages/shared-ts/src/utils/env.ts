/**
 * Environment variable helpers for required/optional retrieval and parsing.
 */

const has = (k: string): boolean => Object.hasOwn(process.env, k);

/** Returns raw env var or undefined when missing. */
export const getEnv = (key: string): string | undefined => process.env[key];

/** Returns env var or throws with a clear message. */
export const getRequired = (key: string): string => {
  const v = process.env[key];
  if (v == null || v === "") throw new Error(`Missing required env: ${key}`);
  return v;
};

/** Parses a boolean env var with common truthy/falsey forms. */
export const getBoolean = (key: string, def?: boolean): boolean => {
  if (!has(key)) return Boolean(def);
  const v = String(process.env[key]).toLowerCase();
  return ["1", "true", "yes", "on"].includes(v);
};

/** Parses a number env var with optional default and min/max clamping. */
export const getNumber = (key: string, def?: number, clamp?: { min?: number; max?: number }): number => {
  const raw = process.env[key];
  const n = raw == null ? def : Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid number env: ${key}`);
  const min = clamp?.min ?? -Infinity;
  const max = clamp?.max ?? Infinity;
  return Math.min(max, Math.max(min, n as number));
};

/** Parses an enum env var ensuring membership in allowed values. */
export const getEnum = <T extends string>(key: string, allowed: readonly T[], def?: T): T => {
  const raw = process.env[key];
  const val = (raw ?? def) as T | undefined;
  if (!val || !allowed.includes(val)) {
    throw new Error(`Invalid enum env: ${key}. Expected one of ${allowed.join(", ")}`);
  }
  return val;
};

/** Gets all variables with a given prefix into a simple object (prefix stripped). */
export const getByPrefix = (prefix: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith(prefix) && v != null) out[k.slice(prefix.length)] = v;
  }
  return out;
};
