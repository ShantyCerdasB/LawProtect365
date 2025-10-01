/**
 * @file array.test.ts
 * @summary Tests for array utilities: compact, uniq, uniqueBy, chunk, groupBy, partition, sumBy, and range.
 * @remarks
 * - Verifies non-mutation of inputs where applicable.
 * - Confirms order stability for uniqueness helpers.
 */

import {
  compact,
  uniq,
  uniqueBy,
  chunk,
  groupBy,
  partition,
  sumBy,
  range} from "../../src/utils/array.js";

describe("compact", () => {
  it("filters out null and undefined", () => {
    const input = [1, null, 2, undefined, 3, null];
    expect(compact(input)).toEqual([1, 2, 3]);
  });

  it("retains other falsy values (0, '', false, NaN)", () => {
    const input = [0, "", false, Number.NaN, null, undefined];
    expect(compact(input)).toEqual([0, "", false, Number.NaN]);
  });

  it("does not mutate the original array", () => {
    const input = [1, null, 2];
    const copy = [...input];
    compact(input);
    expect(input).toEqual(copy);
  });
});

describe("uniq", () => {
  it("returns unique items using strict equality and preserves first occurrence order", () => {
    const input = [3, 1, 2, 3, 2, 1, 4];
    expect(uniq(input)).toEqual([3, 1, 2, 4]);
  });

  it("treats different object references as distinct", () => {
    const a = { id: 1 };
    const b = { id: 1 };
    const input = [a, a, b, a];
    expect(uniq(input)).toEqual([a, b]);
  });

  it("does not mutate the original array", () => {
    const input = [1, 1, 2];
    const copy = [...input];
    uniq(input);
    expect(input).toEqual(copy);
  });
});

describe("uniqueBy", () => {
  interface Item {
    id: number;
    name: string;
  }

  it("returns unique items by key selector and keeps first occurrence", () => {
    const input: Item[] = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 1, name: "A-dup" },
      { id: 3, name: "C" },
      { id: 2, name: "B-dup" },
    ];
    const result = uniqueBy(input, (x) => x.id);
    expect(result).toEqual([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
    ]);
  });

  it("handles empty arrays", () => {
    expect(uniqueBy<Item, number>([], (x) => x.id)).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const input: Item[] = [{ id: 1, name: "A" }, { id: 1, name: "A-dup" }];
    const copy = input.map((x) => ({ ...x }));
    uniqueBy(input, (x) => x.id);
    expect(input).toEqual(copy);
  });
});

describe("chunk", () => {
  it("splits array into chunks of given size with the last chunk possibly smaller", () => {
    const input = [1, 2, 3, 4, 5];
    expect(chunk(input, 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single chunk when size >= array length", () => {
    const input = [1, 2, 3];
    expect(chunk(input, 5)).toEqual([[1, 2, 3]]);
  });

  it("returns an empty array for an empty input", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const input = [1, 2, 3, 4];
    const copy = [...input];
    chunk(input, 2);
    expect(input).toEqual(copy);
  });
});

describe("groupBy", () => {
  it("groups items by string key", () => {
    const input = [1, 2, 3, 4, 5];
    const result = groupBy(input, (n) => (n % 2 === 0 ? "even" as const : "odd" as const));
    expect(result).toEqual({
      odd: [1, 3, 5],
      even: [2, 4]});
  });

  it("groups items by numeric key", () => {
    const input = [10, 11, 12, 13];
    const result = groupBy(input, (n) => Math.floor(n / 10));
    expect(result).toEqual({
      1: [10, 11, 12, 13]});
  });

  it("supports symbol keys", () => {
    const even = Symbol("even");
    const odd = Symbol("odd");
    const input = [1, 2, 3, 4];
    const result = groupBy(input, (n) => (n % 2 === 0 ? even : odd));
    expect(result).toEqual({
      [odd]: [1, 3],
      [even]: [2, 4]});
  });

  it("does not mutate the original array", () => {
    const input = ["a", "bb", "ccc"];
    const copy = [...input];
    groupBy(input, (s) => s.length);
    expect(input).toEqual(copy);
  });
});

describe("partition", () => {
  it("partitions into [pass, fail] per predicate", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const [even, odd] = partition(input, (n) => n % 2 === 0);
    expect(even).toEqual([2, 4, 6]);
    expect(odd).toEqual([1, 3, 5]);
  });

  it("handles empty arrays", () => {
    const [a, b] = partition<number>([], () => true);
    expect(a).toEqual([]);
    expect(b).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const input = [1, 2];
    const copy = [...input];
    partition(input, (n) => n > 1);
    expect(input).toEqual(copy);
  });
});

describe("sumBy", () => {
  it("sums projected numbers", () => {
    const items = [{ v: 1 }, { v: 2 }, { v: 3 }];
    expect(sumBy(items, (x) => x.v)).toBe(6);
  });

  it("returns 0 for empty arrays", () => {
    expect(sumBy<number>([], (x) => x)).toBe(0);
  });

  it("handles negative and positive values", () => {
    const items = [{ v: -5 }, { v: 10 }, { v: -2 }];
    expect(sumBy(items, (x) => x.v)).toBe(3);
  });
});

describe("range", () => {
  it("builds an ascending half-open range [start, end)", () => {
    expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it("returns an empty array when start === end", () => {
    expect(range(2, 2)).toEqual([]);
  });

  it("returns an empty array when start > end", () => {
    expect(range(5, 3)).toEqual([]);
  });
});
