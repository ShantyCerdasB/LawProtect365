/**
 * @file math.randomInt.test.ts
 * @summary Tests for the `randomInt` helper in utils/math.ts.
 * @remarks
 * - Uses module isolation and mocks to safely simulate different RNG environments.
 * - Covers Web Crypto path, Node `crypto.randomInt` fallback, and the error path.
 * - Verifies that the Node fallback is called with an exclusive upper bound (`span = max - min + 1`).
 */

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
      subtle: undefined,
    };

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
        }),
      };
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
});
