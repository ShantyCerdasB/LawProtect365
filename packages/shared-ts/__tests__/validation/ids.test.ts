/**
 * @file ids.test.ts
 * @summary Tests for identifier validators: UUID v4 (generic UUID in Zod), ULID, opaque IDs, and S3 URIs.
 * @remarks
 * - Uses safeParse for precise error assertions (issue codes/metadata instead of brittle message matching).
 * - Confirms ULID is case-insensitive and S3 URI rules (prefix + non-empty remainder).
 */

import {
  UuidV4,
  Ulid,
  OpaqueId,
  S3Uri} from "../../src/validation/ids.js";

describe("UuidV4", () => {
  it("accepts a valid v4 UUID", () => {
    const ok = UuidV4.safeParse("11111111-2222-4333-8444-555555555555");
    expect(ok.success).toBe(true);
  });

  it("rejects an invalid UUID and reports correct Zod issue", () => {
    const bad = UuidV4.safeParse("not-a-uuid");
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const issue = bad.error.issues[0];
      expect(issue.code).toBe("invalid_string");
      // Zod marks .uuid() validation as "uuid"
      expect((issue as any).validation).toBe("uuid");
    }
  });
});

describe("Ulid", () => {
  it("accepts a valid ULID (uppercase)", () => {
    const ok = Ulid.safeParse("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(ok.success).toBe(true);
  });

  it("accepts a valid ULID (lowercase, case-insensitive)", () => {
    const ok = Ulid.safeParse("01arz3ndektsv4rrffq69g5fav");
    expect(ok.success).toBe(true);
  });

  it("rejects malformed ULID with custom message", () => {
    const bad = Ulid.safeParse("not-a-ulid");
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const issue = bad.error.issues[0];
      expect(issue.code).toBe("invalid_string");
      // Regex-based check uses our custom message
      expect(issue.message).toBe("Invalid ULID");
    }
  });
});

describe("OpaqueId", () => {
  it("accepts any non-empty string", () => {
    expect(OpaqueId.safeParse("abc").success).toBe(true);
    // whitespace is allowed by this schema (no trim)
    expect(OpaqueId.safeParse("   ").success).toBe(true);
  });

  it("rejects empty string with length metadata", () => {
    const bad = OpaqueId.safeParse("");
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const issue = bad.error.issues[0];
      expect(issue.code).toBe("too_small");
      expect((issue as any).minimum).toBe(1);
      expect((issue as any).type).toBe("string");
    }
  });
});

describe("S3Uri", () => {
  it("accepts s3://bucket and s3://bucket/key", () => {
    expect(S3Uri.safeParse("s3://my-bucket").success).toBe(true);
    expect(S3Uri.safeParse("s3://my-bucket/path/to/file.txt").success).toBe(true);
  });

  it("rejects when missing s3:// prefix (custom message)", () => {
    const bad = S3Uri.safeParse("http://example.com/x");
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const issue = bad.error.issues[0];
      // startsWith() produces an invalid_string issue with our custom message
      expect(issue.code).toBe("invalid_string");
      expect(issue.message).toBe("Must start with s3://");
    }
  });

  it("rejects when the remainder after s3:// is empty", () => {
    const bad = S3Uri.safeParse("s3://");
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const issue = bad.error.issues[0];
      // refine() produces a custom issue with our message
      expect(issue.code).toBe("custom");
      expect(issue.message).toBe("Bucket or key missing");
    }
  });
});
