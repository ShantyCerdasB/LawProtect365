/**
 * @file env.test.ts
 * @summary Tests for environment variable helpers: retrieval, parsing, and prefix filtering.
 * @remarks
 * - Uses a scoped `withEnv` helper to set/unset environment variables and restore them after each assertion block.
 * - Covers success and error branches for all helpers, including defaults and clamping.
 */

import {
  getEnv,
  getRequired,
  getBoolean,
  getNumber,
  getEnum,
  getByPrefix} from "../../src/utils/env.js";

/**
 * Temporarily sets a group of environment variables for the duration of a callback,
 * then restores their previous values.
 *
 * @param vars Record of env keys to set (use `undefined` to delete).
 * @param fn Callback executed with the temporary environment.
 */
const withEnv = async (vars: Record<string, string | undefined>, fn: () => void | Promise<void>) => {
  const prev: Record<string, string | undefined> = {};
  for (const k of Object.keys(vars)) {
    prev[k] = process.env[k];
  }
  try {
    for (const [k, v] of Object.entries(vars)) {
      if (v === undefined) delete (process.env as any)[k];
      else process.env[k] = v;
    }
    await fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete (process.env as any)[k];
      else process.env[k] = v;
    }
  }
};

describe("getEnv / getRequired", () => {
  it("returns raw env var or undefined when missing", async () => {
    await withEnv({ TEST_ENV_X: "value", TEST_ENV_Y: undefined }, () => {
      expect(getEnv("TEST_ENV_X")).toBe("value");
      expect(getEnv("TEST_ENV_Y")).toBeUndefined();
      expect(getEnv("DOES_NOT_EXIST")).toBeUndefined();
    });
  });

  it("returns value for present var and throws for missing or empty", async () => {
    await withEnv({ REQ1: "v", REQ2: undefined, REQ3: "" }, () => {
      expect(getRequired("REQ1")).toBe("v");
      expect(() => getRequired("REQ2")).toThrow(/Missing required env: REQ2/);
      expect(() => getRequired("REQ3")).toThrow(/Missing required env: REQ3/);
    });
  });
});

describe("getBoolean", () => {
  it("returns default when variable is not present", async () => {
    await withEnv({ BOOL1: undefined }, () => {
      expect(getBoolean("BOOL1", true)).toBe(true);
      expect(getBoolean("BOOL1", false)).toBe(false);
      expect(getBoolean("BOOL1")).toBe(false);
    });
  });

  it("parses common truthy values (case-insensitive)", async () => {
    const truthy = ["1", "true", "TRUE", "yes", "YeS", "on", "ON"];
    for (const v of truthy) {
      // eslint-disable-next-line no-await-in-loop
      await withEnv({ BOOL_T: v }, () => {
        expect(getBoolean("BOOL_T", false)).toBe(true);
      });
    }
  });

  it("treats other values as false (including empty string)", async () => {
    const falsy = ["0", "false", "no", "off", "abc", ""];
    for (const v of falsy) {
      // eslint-disable-next-line no-await-in-loop
      await withEnv({ BOOL_F: v }, () => {
        expect(getBoolean("BOOL_F", true)).toBe(false);
      });
    }
  });
});

describe("getNumber", () => {
  it("uses default when missing and applies clamping to default", async () => {
    await withEnv({ NUM_MISSING: undefined }, () => {
      expect(getNumber("NUM_MISSING", 10)).toBe(10);
      expect(getNumber("NUM_MISSING", 10, { min: 20 })).toBe(20);
      expect(getNumber("NUM_MISSING", 10, { max: 5 })).toBe(5);
    });
  });

  it("parses numeric strings and clamps within min/max", async () => {
    await withEnv({ NUM_A: "42", NUM_LOW: "-10", NUM_HIGH: "1000" }, () => {
      expect(getNumber("NUM_A")).toBe(42);
      expect(getNumber("NUM_LOW", 0, { min: 0 })).toBe(0);
      expect(getNumber("NUM_HIGH", 0, { max: 100 })).toBe(100);
      expect(getNumber("NUM_A", 0, { min: 40, max: 41 })).toBe(41);
    });
  });

  it("throws on invalid number values", async () => {
    await withEnv({ NUM_BAD: "abc" }, () => {
      expect(() => getNumber("NUM_BAD")).toThrow(/Invalid number env: NUM_BAD/);
    });
  });
});

describe("getEnum", () => {
  const ALLOWED = ["A", "B", "C"] as const;
  type Allowed = (typeof ALLOWED)[number];

  it("returns the value when present and allowed", async () => {
    await withEnv({ MODE: "B" }, () => {
      const v = getEnum<Allowed>("MODE", ALLOWED);
      expect(v).toBe("B");
    });
  });

  it("returns the default when missing and default is allowed", async () => {
    await withEnv({ MODE2: undefined }, () => {
      const v = getEnum<Allowed>("MODE2", ALLOWED, "A");
      expect(v).toBe("A");
    });
  });

  it("throws when missing and no default provided", async () => {
    await withEnv({ MODE3: undefined }, () => {
      expect(() => getEnum<Allowed>("MODE3", ALLOWED)).toThrow(/Invalid enum env: MODE3/);
    });
  });

  it("throws when value is not in the allowed set", async () => {
    await withEnv({ MODE4: "Z" }, () => {
      expect(() => getEnum<Allowed>("MODE4", ALLOWED)).toThrow(/Invalid enum env: MODE4/);
    });
  });
});

describe("getByPrefix", () => {
  it("collects variables by prefix and strips the prefix", async () => {
    await withEnv(
      {
        APP_FOO: "x",
        APP_BAR: "y",
        APP_BAZ: "", // included (non-null)
        OTHER_Q: "z"},
      () => {
        const res = getByPrefix("APP_");
        expect(res).toEqual({ FOO: "x", BAR: "y", BAZ: "" });
        expect(Object.keys(res)).not.toContain("OTHER_Q");
      }
    );
  });
});
