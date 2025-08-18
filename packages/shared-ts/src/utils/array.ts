/**
 * Array utilities for grouping, uniqueness, partitioning and aggregation.
 */

/** Filters out null and undefined values. */
export const compact = <T>(arr: Array<T | null | undefined>): T[] =>
  arr.filter((x): x is T => x != null);

/** Returns unique items using strict equality. */
export const uniq = <T>(arr: T[]): T[] => Array.from(new Set(arr));

/** Returns unique items by a key selector. */
export const uniqueBy = <T, K>(arr: T[], key: (t: T) => K): T[] => {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
};

/** Splits an array into chunks of given size. */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/** Groups items by key. */
export const groupBy = <T, K extends string | number | symbol>(
  arr: T[],
  key: (t: T) => K
): Record<K, T[]> => {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
};

/** Partitions an array into [pass, fail] according to predicate. */
export const partition = <T>(arr: T[], pred: (t: T) => boolean): [T[], T[]] => {
  const a: T[] = [];
  const b: T[] = [];
  for (const x of arr) (pred(x) ? a : b).push(x);
  return [a, b];
};

/** Sums numeric projection of items. */
export const sumBy = <T>(arr: T[], fn: (t: T) => number): number =>
  arr.reduce((acc, t) => acc + fn(t), 0);

/** Builds an array [start, start+1, ..., end-1]. */
export const range = (start: number, end: number): number[] => {
  const out: number[] = [];
  for (let i = start; i < end; i++) out.push(i);
  return out;
};
