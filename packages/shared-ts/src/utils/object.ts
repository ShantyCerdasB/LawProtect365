/**
 * Object utilities for picking, omitting, deep merging and path access.
 */

/** Creates a shallow clone containing only selected keys. */
export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const out = {} as Pick<T, K>;
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
};

/** Returns a shallow clone excluding specified keys. */
export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const out = { ...obj } as any;
  for (const k of keys) delete out[k];
  return out;
};

/** Returns true when value is a plain object. */
export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && v.constructor === Object;

/** Deep merges two values with object/object strategy and array replace. */
export const deepMerge = <T>(a: T, b: Partial<T>): T => {
  if (Array.isArray(a) && Array.isArray(b)) return b as T;
  if (isPlainObject(a) && isPlainObject(b)) {
    const out: Record<string, unknown> = { ...a };
    for (const [k, v] of Object.entries(b)) {
      const av = (a as any)[k];
      out[k] = isPlainObject(av) && isPlainObject(v) ? deepMerge(av, v as any) : v;
    }
    return out as T;
  }
  return (b as T) ?? a;
};

/** Gets a nested property using dot notation. */
export const getPath = (obj: unknown, path: string): unknown => {
  if (!isPlainObject(obj)) return undefined;
  return path.split(".").reduce<any>((acc, key) => (isPlainObject(acc) ? (acc as any)[key] : undefined), obj);
};

/** Sets a nested property using dot notation (mutates and returns obj). */
export const setPath = (obj: any, path: string, value: unknown): any => {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!isPlainObject(cur[p])) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
  return obj;
};
