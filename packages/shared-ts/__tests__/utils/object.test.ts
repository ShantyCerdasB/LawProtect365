/**
 * @file object.test.ts
 * @summary Tests for object helpers: pick, omit, isPlainObject, deepMerge, getPath, setPath.
 * @remarks
 * - Mirrors current behavior: arrays are replaced (not merged) in deepMerge.
 * - getPath only walks through plain objects because of isPlainObject checks at each hop.
 * - setPath creates plain-object intermediates and overwrites non-object hops.
 */

import {
  pick,
  omit,
  isPlainObject,
  deepMerge,
  getPath,
  setPath,
} from "../../src/utils/object.js";

/** pick */
describe("pick", () => {
  it("keeps only the selected keys that exist on the source", () => {
    const src = { a: 1, b: 2, c: 3 };
    const out = pick(src, ["a", "c", "x"] as Array<keyof typeof src>);
    expect(out).toEqual({ a: 1, c: 3 });
    // does not mutate the source
    expect(src).toEqual({ a: 1, b: 2, c: 3 });
  });
});

/** omit */
describe("omit", () => {
  it("drops the given keys and does not mutate the original", () => {
    const src = { a: 1, b: 2, c: 3 };
    const out = omit(src, ["b", "z"] as Array<keyof typeof src>);
    expect(out).toEqual({ a: 1, c: 3 });
    expect(src).toEqual({ a: 1, b: 2, c: 3 });
    expect(out).not.toBe(src); // shallow clone
  });
});

/** isPlainObject */
describe("isPlainObject", () => {
  it("returns true for plain objects with Object constructor", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it("returns false for arrays, null, primitives, and class instances", () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject("x")).toBe(false);
    expect(isPlainObject(1)).toBe(false);
    expect(isPlainObject(true)).toBe(false);
    class Foo { constructor() { this.bar = 'baz'; } }
    expect(isPlainObject(new Foo())).toBe(false);
  });

  it("treats Object.create(null) as non-plain with this implementation", () => {
    const o = Object.create(null);
    (o as any).a = 1;
    expect(isPlainObject(o)).toBe(false);
  });
});

/** deepMerge */
describe("deepMerge", () => {
  it("recursively merges plain objects", () => {
  const a = { x: 1, o: { a: 1, b: 2 } };
  const b: Partial<typeof a> = { o: { a: 1, b: 99 } }; // 'o' must be complete
  const out = deepMerge(a, b);
  expect(out).toEqual({ x: 1, o: { a: 1, b: 99 } });
  // source is not mutated
  expect(a).toEqual({ x: 1, o: { a: 1, b: 2 } });
});


  it("replaces arrays wholesale (no concatenation)", () => {
    const a = { arr: [1, 2, 3], o: { k: [1] } };
    const b = { arr: [9], o: { k: [2, 3] } };
    const out = deepMerge(a, b);
    expect(out).toEqual({ arr: [9], o: { k: [2, 3] } });
  });

  it("prefers b for non-object roots when b is defined", () => {
    expect(deepMerge(1 as any, 2 as any)).toBe(2);
    expect(deepMerge("a" as any, undefined as any)).toBe("a");
  });

  it("overwrites with b when b is non-object at a key", () => {
    const a = { x: { y: 1 }, v: 1 as unknown as number | string };
    const b = { x: 2 as any, v: "s" as any };
    const out = deepMerge(a, b);
    expect(out).toEqual({ x: 2, v: "s" });
  });
});

/** getPath */
describe("getPath", () => {
  it("reads nested properties via dot notation", () => {
    const obj = { a: { b: { c: 42 } } };
    expect(getPath(obj, "a.b.c")).toBe(42);
    expect(getPath(obj, "a.b.x")).toBeUndefined();
    expect(getPath(obj, "x")).toBeUndefined();
  });

  it("returns undefined when the root is not a plain object", () => {
    expect(getPath([], "length")).toBeUndefined();
    expect(getPath(null, "a")).toBeUndefined();
  });

  it("does not traverse arrays by design (plain-object gate at each hop)", () => {
    const obj = { a: [{ b: 1 }] };
    // once it hits 'a' (an array), traversal stops
    expect(getPath(obj, "a.0.b")).toBeUndefined();
  });
});

/** setPath */
describe("setPath", () => {
  it("creates intermediate objects and sets the value", () => {
    const obj: any = {};
    const ret = setPath(obj, "a.b.c", 7);
    expect(ret).toBe(obj); // mutates and returns the same object
    expect(obj).toEqual({ a: { b: { c: 7 } } });
  });

  it("replaces non-object hops with a new plain object", () => {
    const obj: any = { a: 1 };
    setPath(obj, "a.b", 3);
    expect(obj).toEqual({ a: { b: 3 } });
  });

  it("does not support array indices: arrays become plain objects along the path", () => {
    const obj: any = { a: [] };
    setPath(obj, "a.0.b", 1);
    // because of the plain-object check, 'a' is turned into an object
    expect(obj).toEqual({ a: { "0": { b: 1 } } });
  });
});
