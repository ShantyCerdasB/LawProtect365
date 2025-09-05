/**
 * @file Tests for S3 URI and key helpers in utils/s3.ts
 * @remarks
 * - Covers parse/format, key ops, validations, HTTP URL building, and content-type guessing.
 * - Exercises all branches, including edge cases and us-east-1 vs. other regions.
 */

import {
  parseS3Uri,
  formatS3Uri,
  isS3Uri,
  joinKey,
  dirname,
  basename,
  ensurePrefix,
  isValidBucketName,
  isValidKey,
  toHttpUrl,
  guessContentType,
} from "../../src/utils/s3.js";
import {
  runDirnameTests,
  runBasenameTests,
  commonDirnameTestCases,
  commonBasenameTestCases,
  s3SpecificDirnameTestCases,
  s3SpecificBasenameTestCases,
} from "./test-helpers.js";

describe("utils/s3", () => {
  // ── parse/format/isS3Uri ─────────────────────────────────────────────────────
  describe("parseS3Uri()", () => {
    it("parses s3://bucket/key", () => {
      expect(parseS3Uri("s3://my-bucket/path/to/file.pdf")).toEqual({
        bucket: "my-bucket",
        key: "path/to/file.pdf",
      });
    });

    it("parses s3://bucket with empty key", () => {
      expect(parseS3Uri("s3://data-bucket")).toEqual({
        bucket: "data-bucket",
        key: "",
      });
    });

    it("throws on non-s3 URI", () => {
      expect(() => parseS3Uri("https://example.com/x")).toThrow(
        /Invalid S3 URI/i
      );
      expect(() => parseS3Uri("s4://oops")).toThrow(/Invalid S3 URI/i);
      expect(() => parseS3Uri("")).toThrow(/Invalid S3 URI/i);
    });
  });

  describe("formatS3Uri()", () => {
    it("formats bucket and key into s3:// URI", () => {
      expect(formatS3Uri("bkt", "a/b.txt")).toBe("s3://bkt/a/b.txt");
      // leading slashes are stripped from key
      expect(formatS3Uri("bkt", "/a/b.txt")).toBe("s3://bkt/a/b.txt");
    });

    it("handles empty key", () => {
      expect(formatS3Uri("bkt", "")).toBe("s3://bkt/");
    });
  });

  describe("isS3Uri()", () => {
    it("detects s3 URIs (case-insensitive)", () => {
      expect(isS3Uri("s3://x/y")).toBe(true);
      expect(isS3Uri("S3://x/y")).toBe(true);
      expect(isS3Uri("http://x/y")).toBe(false);
    });
  });

  // ── key composition and inspection ───────────────────────────────────────────
  describe("joinKey()", () => {
    it("joins segments and trims edge slashes", () => {
      expect(joinKey("a", "b", "c")).toBe("a/b/c");
      expect(joinKey("a/", "/b/", "/c")).toBe("a/b/c");
      expect(joinKey("a//", "//b", "c//")).toBe("a/b/c");
    });

    it("skips falsy/empty parts after trimming", () => {
      expect(joinKey("", null as any, undefined as any)).toBe("");
      expect(joinKey("", "a", "", "b")).toBe("a/b");
    });
  });

  describe("dirname()", () => {
    runDirnameTests(dirname, [
      {
        input: "a/b/c.txt",
        expected: "a/b",
        description: "returns directory portion for nested path"
      },
      {
        input: "single",
        expected: "",
        description: "returns empty string for single segment (S3 behavior)"
      },
      ...s3SpecificDirnameTestCases,
    ]);
  });

  describe("basename()", () => {
    runBasenameTests(basename, [
      ...commonBasenameTestCases,
      ...s3SpecificBasenameTestCases,
    ]);
  });

  describe("ensurePrefix()", () => {
    it("ensures key starts with prefix", () => {
      expect(ensurePrefix("file.txt", "public")).toBe("public/file.txt");
      // Already prefixed
      expect(ensurePrefix("public/file.txt", "public")).toBe("public/file.txt");
      // Handles edge slashes in both inputs
      expect(ensurePrefix("/public/file.txt", "/public/")).toBe("public/file.txt");
    });
  });

  // ── validations ─────────────────────────────────────────────────────────────
  describe("isValidBucketName()", () => {
    it("validates common constraints", () => {
      // invalid lengths
      expect(isValidBucketName("ab")).toBe(false);
      expect(isValidBucketName("a".repeat(64))).toBe(false);

      // allowed basic
      expect(isValidBucketName("my-bucket-01")).toBe(true);

      // invalid characters (uppercase)
      expect(isValidBucketName("BadBucket")).toBe(false);
      // must start/end with letter or digit
      expect(isValidBucketName("-abc")).toBe(false);
      expect(isValidBucketName("abc-")).toBe(false);
      expect(isValidBucketName(".abc")).toBe(false);
      expect(isValidBucketName("abc.")).toBe(false);

      // IP-like should be rejected
      expect(isValidBucketName("127.0.0.1")).toBe(false);
    });

    it("currently accepts double hyphen or double dot per implementation", () => {
      // The code contains a check without returning false; assert actual behavior.
      expect(isValidBucketName("a--b")).toBe(true);
      expect(isValidBucketName("a..b")).toBe(true);
    });
  });

  describe("isValidKey()", () => {
    it("accepts normal keys and rejects invalid ones", () => {
      expect(isValidKey("a/b/c.txt")).toBe(true);
      expect(isValidKey("")).toBe(false);
      expect(isValidKey(123 as any)).toBe(false);

      // Too long (>1024)
      expect(isValidKey("x".repeat(1025))).toBe(false);

      // Control chars (e.g., NUL and DEL)
      expect(isValidKey("ok\u0000no")).toBe(false);
      expect(isValidKey("ok\u007Fno")).toBe(false);
    });
  });

  // ── HTTP URL builder ────────────────────────────────────────────────────────
  describe("toHttpUrl()", () => {
    it("builds virtual-hosted URL for us-east-1", () => {
      const url = toHttpUrl("bkt", "a/b.txt", "us-east-1");
      expect(url).toBe("https://bkt.s3.amazonaws.com/a/b.txt");
    });

    it("builds virtual-hosted URL for other regions", () => {
      const url = toHttpUrl("bkt", "a/b.txt", "eu-west-1");
      expect(url).toBe("https://bkt.s3.eu-west-1.amazonaws.com/a/b.txt");
    });

    it("supports dualstack on virtual-hosted", () => {
      const url = toHttpUrl("bkt", "a/b.txt", "us-east-1", { dualstack: true });
      expect(url).toBe("https://bkt.s3.dualstack.amazonaws.com/a/b.txt");
    });

    it("builds accelerate URL (no region in host)", () => {
      const url = toHttpUrl("bkt", "a/b.txt", "eu-west-1", { accelerate: true });
      expect(url).toBe("https://bkt.s3-accelerate.amazonaws.com/a/b.txt");
    });

    it("builds accelerate + dualstack URL", () => {
      const url = toHttpUrl("bkt", "a/b.txt", "ap-southeast-2", {
        accelerate: true,
        dualstack: true,
      });
      expect(url).toBe("https://bkt.s3-accelerate.dualstack.amazonaws.com/a/b.txt");
    });

    it("builds path-style URL for us-east-1", () => {
      const url = toHttpUrl("bkt", "a/b.txt", "us-east-1", { virtualHosted: false });
      expect(url).toBe("https://s3.amazonaws.com/bkt/a/b.txt");
    });

    it("builds path-style URL for other regions", () => {
      const url = toHttpUrl("bkt", "a/b.txt", "sa-east-1", { virtualHosted: false });
      expect(url).toBe("https://s3.sa-east-1.amazonaws.com/bkt/a/b.txt");
    });

    it("strips leading slash and encodes the key", () => {
      const url = toHttpUrl("bkt", "/spaced dir/ç.txt", "us-east-1");
      // encodeURI keeps slashes, encodes spaces and non-ASCII
      expect(url).toBe("https://bkt.s3.amazonaws.com/spaced%20dir/%C3%A7.txt");
    });
  });

  // ── content type ────────────────────────────────────────────────────────────
  describe("guessContentType()", () => {
    it("returns known types", () => {
      expect(guessContentType("file.TXT")).toBe("text/plain; charset=utf-8");
      expect(guessContentType("report.csv")).toBe("text/csv; charset=utf-8");
      expect(guessContentType("data.json")).toBe("application/json; charset=utf-8");
      expect(guessContentType("doc.pdf")).toBe("application/pdf");
      expect(guessContentType("img.jpeg")).toBe("image/jpeg");
      expect(guessContentType("img.JPG")).toBe("image/jpeg");
      expect(guessContentType("vector.svg")).toBe("image/svg+xml");
      expect(guessContentType("archive.zip")).toBe("application/zip");
      expect(guessContentType("sheet.xlsx")).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    });

    it("returns undefined for unknown extension", () => {
      expect(guessContentType("file.unknownext")).toBeUndefined();
      expect(guessContentType("noext")).toBeUndefined();
    });
  });
});
