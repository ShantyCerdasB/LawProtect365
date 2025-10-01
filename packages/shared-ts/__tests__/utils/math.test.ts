/**
 * @file math.test.ts
 * @summary Tests for all math helpers in utils/math.ts.
 * @remarks
 * - Uses module isolation and mocks to safely simulate different RNG environments.
 * - Covers Web Crypto path, Node `crypto.randomInt` fallback, and the error path.
 * - Verifies that the Node fallback is called with an exclusive upper bound (`span = max - min + 1`).
 */

import { clamp, roundTo, lerp, sum, mean, median } from "../../src/utils/math.js";

describe("clamp()", () => {
  it("clamps values to the specified range", () => {
    expect(clamp(10, 0, 5)).toBe(5);
    expect(clamp(-1, 0, 5)).toBe(0);
    expect(clamp(3, 0, 5)).toBe(3);
    expect(clamp(0, 0, 5)).toBe(0);
    expect(clamp(5, 0, 5)).toBe(5);
  });

  it("handles edge cases", () => {
    expect(clamp(0, 0, 0)).toBe(0);
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(100, 1, 10)).toBe(10);
  });
});

describe("roundTo()", () => {
  it("rounds to specified decimal places", () => {
    expect(roundTo(1.2345, 2)).toBe(1.23);
    expect(roundTo(1.2355, 2)).toBe(1.24);
    expect(roundTo(12.5)).toBe(13);
    expect(roundTo(12.4)).toBe(12);
  });

  it("handles edge cases", () => {
    expect(roundTo(0, 2)).toBe(0);
    expect(roundTo(1.999, 2)).toBe(2);
    expect(roundTo(-1.2345, 2)).toBe(-1.23);
  });
});

describe("lerp()", () => {
  it("performs linear interpolation", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(0, 100, 0.25)).toBe(25);
  });

  it("handles edge cases", () => {
    expect(lerp(5, 5, 0.5)).toBe(5);
    expect(lerp(0, 0, 0.5)).toBe(0);
  });
});

describe("sum()", () => {
  it("computes sum of array elements", () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([1, -2, 3])).toBe(2);
    expect(sum([0.1, 0.2, 0.3])).toBeCloseTo(0.6);
  });

  it("handles edge cases", () => {
    expect(sum([])).toBe(0);
    expect(sum([5])).toBe(5);
    expect(sum([0, 0, 0])).toBe(0);
  });
});

describe("mean()", () => {
  it("computes arithmetic mean", () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(mean([1, 3, 5])).toBe(3);
    expect(mean([0, 10])).toBe(5);
  });

  it("handles edge cases", () => {
    expect(mean([])).toBe(0);
    expect(mean([5])).toBe(5);
    expect(mean([0, 0, 0])).toBe(0);
  });
});

describe("median()", () => {
  it("computes median for odd-length arrays", () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 5, 3, 7, 2])).toBe(3);
  });

  it("computes median for even-length arrays", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([1, 3, 5, 7])).toBe(4);
  });

  it("handles edge cases", () => {
    expect(median([])).toBe(0);
    expect(median([5])).toBe(5);
    expect(median([1, 1])).toBe(1);
  });

  it("does not mutate the input array", () => {
    const arr = [3, 1, 2];
    median(arr);
    expect(arr).toEqual([3, 1, 2]);
  });
});

describe("randomInt()", () => {
  const originalWebCrypto = (globalThis as any).crypto;

  afterEach(() => {
    (globalThis as any).crypto = originalWebCrypto;
    jest.resetModules();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("uses Web Crypto when available", async () => {
    /**
     * Install a deterministic `getRandomValues`:
     * fills the buffer with zeros so the result is stable and within range.
     */
    (globalThis as any).crypto = {
      getRandomValues<T extends ArrayBufferView>(arr: T): T {
        const u8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
        u8.fill(0);
        return arr;
      },
      subtle: undefined};

    await jest.isolateModulesAsync(async () => {
      const { randomInt } = await import("../../src/utils/math.js");
      const n = randomInt(0, 6);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(6);
    });
  });

  it("uses Node `crypto.randomInt` when Web Crypto is unavailable", async () => {
    (globalThis as any).crypto = undefined;

    /**
     * Mock `node:crypto` before importing the SUT.
     * The implementation should call `randomInt(0, span)` with exclusive upper bound,
     * where `span = (max - min + 1)`. For (0, 6), span is 7.
     */
    jest.doMock("node:crypto", () => {
      const actual = jest.requireActual<any>("node:crypto");
      return {
        ...actual,
        randomInt: jest.fn((min: number, max: number) => {
          expect(min).toBe(0);
          expect(max).toBe(7);
          return 0; // deterministic return
        })};
    });

    await jest.isolateModulesAsync(async () => {
      const { randomInt } = await import("../../src/utils/math.js");
      const n = randomInt(0, 6);
      expect(n).toBe(0);

      const mocked = await import("node:crypto");
      expect((mocked as any).randomInt).toHaveBeenCalledWith(0, 7);
    });
  });

  it("throws when neither Web Crypto nor Node `crypto.randomInt` are available", async () => {
    (globalThis as any).crypto = undefined;

    /** Remove `randomInt` from the Node crypto mock to trigger the error branch. */
    jest.doMock("node:crypto", () => {
      const actual = jest.requireActual<any>("node:crypto");
      return { ...actual, randomInt: undefined };
    });

    await jest.isolateModulesAsync(async () => {
      const { randomInt } = await import("../../src/utils/math.js");
      expect(() => randomInt(1, 3)).toThrow(/secure/i);
    });
  });

  it("throws for invalid range with non-finite numbers", async () => {
    await jest.isolateModulesAsync(async () => {
      const { randomInt } = await import("../../src/utils/math.js");
      expect(() => randomInt(Number.NaN, 5)).toThrow("Invalid range");
      expect(() => randomInt(1, Infinity)).toThrow("Invalid range");
      expect(() => randomInt(-Infinity, 5)).toThrow("Invalid range");
    });
  });

  it("swaps min and max when min > max", async () => {
    await jest.isolateModulesAsync(async () => {
      const { randomInt } = await import("../../src/utils/math.js");
      // Mock crypto to return deterministic values
      (globalThis as any).crypto = {
        getRandomValues<T extends ArrayBufferView>(arr: T): T {
          const u8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
          u8.fill(0);
          return arr;
        },
        subtle: undefined};
      
      const result = randomInt(10, 5);
      expect(result).toBeGreaterThanOrEqual(5);
      expect(result).toBeLessThanOrEqual(10);
    });
  });

  it("handles single value range", async () => {
    await jest.isolateModulesAsync(async () => {
      const { randomInt } = await import("../../src/utils/math.js");
      const result = randomInt(5, 5);
      expect(result).toBe(5);
    });
  });
});
