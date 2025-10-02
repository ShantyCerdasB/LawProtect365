/**
 * @file json.test.ts
 * @summary Tests for JSON utilities: parsing, safe parsing, base64 parsing, stable stringification, deep clone, equality, object guard, and compact stringify.
 * @remarks
 * - Confirms error handling behavior for parseJson and parseBase64Json.
 * - Verifies deterministic key ordering and circular detection in stableStringify.
 * - Exercises deepClone in both structuredClone and fallback branches.
 * - Ensures jsonEquals ignores key order differences.
 */

import {
  parseJson,
  parseJsonSafe,
  parseBase64Json,
  stableStringify,
  deepClone,
  jsonEquals,
  isJsonObject,
  stringifyCompact} from "../../src/utils/json.js";

describe("parseJson", () => {
  it("parses valid JSON", () => {
    const src = '{"a":1,"b":[2,3]}';
    expect(parseJson(src)).toEqual({ a: 1, b: [2, 3] });
  });

  it("throws an Error on invalid JSON with a message", () => {
    const bad = "{";
    expect(() => parseJson(bad)).toThrow(Error);
    try {
      parseJson(bad);
    } catch (e) {
      const msg = (e as Error).message;
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it("supports a custom reviver", () => {
    const src = '{"d":"2020-01-01"}';
    const out = parseJson(src, (k, v) => (k === "d" ? new Date(v as string).toISOString() : v));
    expect(out).toEqual({ d: "2020-01-01T00:00:00.000Z" });
  });
});

describe("parseJsonSafe", () => {
  it("returns { ok: true } with parsed value", () => {
    const r = parseJsonSafe('{"x":42}');
    expect(r).toEqual({ ok: true, value: { x: 42 } });
  });

  it("returns { ok: false } with an Error on invalid input", () => {
    const r = parseJsonSafe("[,]");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBeInstanceOf(Error);
      expect((r.error.message ?? "").length).toBeGreaterThan(0);
    }
  });
});

describe("parseBase64Json", () => {
  it("parses base64-encoded JSON", () => {
    const obj = { a: 1, b: "ok" };
    const b64 = Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
    expect(parseBase64Json<typeof obj>(b64)).toEqual(obj);
  });

  it("throws when base64 decodes to invalid JSON", () => {
    const badJson = Buffer.from("{", "utf8").toString("base64");
    expect(() => parseBase64Json(badJson)).toThrow(Error);
  });
});

describe("stableStringify", () => {
  it("sorts object keys deterministically (shallow and nested)", () => {
    const value = { b: { y: 2, x: 1 }, a: 0 };
    const s = stableStringify(value);
    expect(s).toBe('{"a":0,"b":{"x":1,"y":2}}');
  });

  it("preserves array order while sorting object keys inside arrays", () => {
  const value: { arr: Array<Record<string, number>> } = {
    arr: [{ b: 2, a: 1 }, { d: 4, c: 3 }]};
  const s = stableStringify(value);
  expect(s).toBe('{"arr":[{"a":1,"b":2},{"c":3,"d":4}]}');
});

  it("throws a TypeError on circular references", () => {
    const obj: any = {};
    obj.self = obj;
    expect(() => stableStringify(obj)).toThrow(new TypeError("Converting circular structure to JSON"));
  });

  it("respects the `space` argument for pretty printing", () => {
    const s = stableStringify({ b: 2, a: 1 }, 2);
    expect(s).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });
});

describe("deepClone", () => {
  const sample = { a: 1, b: { c: [1, 2, { d: "x" }] } };

  it("produces a deep copy that does not share references", () => {
    const cloned = deepClone(sample);
    expect(cloned).toEqual(sample);
    expect(cloned).not.toBe(sample);
    expect(cloned.b).not.toBe(sample.b);
    (cloned.b.c[2] as any).d = "y";
    expect(sample.b.c[2]).toEqual({ d: "x" });
  });

  it("uses structuredClone when available (native branch)", () => {
    const original = { x: { y: 1 } };
    const spy = jest.fn((v: unknown) => structuredClone(v));
    const orig = (globalThis as any).structuredClone;
    (globalThis as any).structuredClone = spy;
    try {
      const out = deepClone(original);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(out).toEqual(original);
      expect(out).not.toBe(original);
    } finally {
      (globalThis as any).structuredClone = orig;
    }
  });

  it("falls back to JSON round-trip when structuredClone is unavailable", () => {
    const original = { x: [1, 2, 3] };
    const orig = (globalThis as any).structuredClone;
    (globalThis as any).structuredClone = undefined;
    try {
      const out = deepClone(original);
      expect(out).toEqual(original);
      expect(out).not.toBe(original);
      expect(out.x).not.toBe(original.x);
    } finally {
      (globalThis as any).structuredClone = orig;
    }
  });
});

describe("jsonEquals", () => {
  it("returns true for semantically equal values regardless of key order", () => {
    const a = { b: 2, a: 1, n: { z: 9, y: 8 } };
    const b = { a: 1, n: { y: 8, z: 9 }, b: 2 };
    expect(jsonEquals(a, b)).toBe(true);
  });

  it("returns false for different values", () => {
    expect(jsonEquals({ a: 1 }, { a: 2 })).toBe(false);
    expect(jsonEquals([1, 2, 3] as any, [1, 3, 2] as any)).toBe(false);
  });
});

describe("isJsonObject", () => {
  it("detects plain JSON objects", () => {
    expect(isJsonObject({})).toBe(true);
    expect(isJsonObject({ a: 1 })).toBe(true);
  });

  it("returns false for arrays, null, and primitives", () => {
    expect(isJsonObject([])).toBe(false);
    expect(isJsonObject(null)).toBe(false);
    expect(isJsonObject("x")).toBe(false);
    expect(isJsonObject(1)).toBe(false);
    expect(isJsonObject(true)).toBe(false);
  });
});

describe("stringifyCompact", () => {
  it("matches JSON.stringify output exactly", () => {
    const v = { b: 2, a: 1, arr: [3, 2, 1] };
    expect(stringifyCompact(v)).toBe(JSON.stringify(v));
  });
});
