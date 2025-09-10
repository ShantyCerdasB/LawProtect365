/**
 * @file env.test.ts
 * @summary Tests for environment loader and schema: Env, loadEnv.
 * @remarks
 * - Starts each test from a clean `process.env` snapshot to avoid cross-contamination.
 * - Verifies defaults, required fields, optionals, and flexible error metadata shape.
 * - The error metadata container may vary (e.g., `meta`, `details`, `data`, etc.); the test
 *   looks for a Zod-like `issues` array across common containers to stay implementation-agnostic.
 */

import { Env, loadEnv } from "../../src/validation/env.js";

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  // Use a fresh, mutable env object for each test.
  process.env = {};
});

afterEach(() => {
  // Restore the original environment object.
  process.env = ORIGINAL_ENV;
});

describe("validation/env", () => {
  it("parses required fields and applies defaults (ENV, LOG_LEVEL)", () => {
    process.env.PROJECT_NAME = "my-project";
    process.env.SERVICE_NAME = "api";
    process.env.AWS_REGION = "us-east-1";

    const cfg = loadEnv(Env);

    // Defaults
    expect(cfg.ENV).toBe("dev");
    expect(cfg.LOG_LEVEL).toBe("info");

    // Required fields
    expect(cfg.PROJECT_NAME).toBe("my-project");
    expect(cfg.SERVICE_NAME).toBe("api");
    expect(cfg.AWS_REGION).toBe("us-east-1");

    // Optionals absent
    expect("JWT_ISSUER" in cfg).toBe(false);
    expect("JWT_AUDIENCE" in cfg).toBe(false);
  });

  it("accepts explicit ENV/LOG_LEVEL and optional JWT fields", () => {
    process.env.PROJECT_NAME = "proj";
    process.env.SERVICE_NAME = "svc";
    process.env.AWS_REGION = "eu-west-1";
    process.env.ENV = "staging";
    process.env.LOG_LEVEL = "debug";
    process.env.JWT_ISSUER = "https://issuer.example.com";
    process.env.JWT_AUDIENCE = "my-audience";

    const cfg = loadEnv(Env);

    expect(cfg.ENV).toBe("staging");
    expect(cfg.LOG_LEVEL).toBe("debug");
    expect(cfg.JWT_ISSUER).toBe("https://issuer.example.com");
    expect(cfg.JWT_AUDIENCE).toBe("my-audience");
  });

  it("throws an error with Zod issues when required fields are missing", () => {
    // Missing PROJECT_NAME on purpose
    process.env.SERVICE_NAME = "svc";
    process.env.AWS_REGION = "eu";

    try {
      loadEnv(Env);
      throw new Error("Expected loadEnv to throw");
    } catch (e: any) {
      // Error surface
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe("Invalid server configuration");

      // Try common containers for the Zod issues array
      const issues =
        e?.meta?.issues ??
        e?.details?.issues ??
        e?.data?.issues ??
        e?.context?.issues ??
        e?.extra?.issues ??
        e?.payload?.issues ??
        e?.info?.issues ??
        e?.issues;

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);

      // One issue should reference PROJECT_NAME
      const hasProjectIssue = issues.some(
        (iss: any) => Array.isArray(iss?.path) && iss.path.includes("PROJECT_NAME"));
      expect(hasProjectIssue).toBe(true);

      // Optional: code and status (if exposed by your AppError)
      if ("code" in e) expect(e.code).toBeDefined();
      if ("httpStatus" in e) expect(e.httpStatus).toBe(500);
    }
  });

  it("rejects invalid enum values for ENV and LOG_LEVEL", () => {
    process.env.PROJECT_NAME = "p";
    process.env.SERVICE_NAME = "s";
    process.env.AWS_REGION = "ap-southeast-1";
    process.env.ENV = "local" as any;        // invalid
    process.env.LOG_LEVEL = "verbose" as any; // invalid

    expect(() => loadEnv(Env)).toThrow("Invalid server configuration");
  });

  it("validates JWT_ISSUER as URL when provided", () => {
    process.env.PROJECT_NAME = "p";
    process.env.SERVICE_NAME = "s";
    process.env.AWS_REGION = "ap-southeast-2";
    process.env.JWT_ISSUER = "not-a-url";

    expect(() => loadEnv(Env)).toThrow("Invalid server configuration");

    process.env.JWT_ISSUER = "https://issuer.example";
    const cfg = loadEnv(Env);
    expect(cfg.JWT_ISSUER).toBe("https://issuer.example");
  });
});
