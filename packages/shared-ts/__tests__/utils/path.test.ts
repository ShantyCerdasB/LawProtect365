/**
 * @file Tests for POSIX path helpers in utils/path.ts
 * @remarks
 * - Covers all helpers and their branches using path.posix semantics.
 */

import {
  toPosix,
  join,
  normalize,
  dirname,
  basename,
  extname,
  ensureLeadingSlash,
  stripLeadingSlash,
  ensureTrailingSlash,
  stripTrailingSlash,
  isSubpath,
  split,
} from "../../src/utils/path.js";
import {
  runDirnameTests,
  runBasenameTests,
  commonDirnameTestCases,
  commonBasenameTestCases,
  pathSpecificDirnameTestCases,
  pathSpecificBasenameTestCases,
} from "./test-helpers.js";

describe("utils/path", () => {
  describe("toPosix()", () => {
    it("replaces backslashes with forward slashes", () => {
      expect(toPosix("a\\b\\c")).toBe("a/b/c");
      expect(toPosix("a/b")).toBe("a/b");
    });
  });

  describe("join()", () => {
    it("joins segments with POSIX semantics", () => {
      expect(join("a", "b", "c")).toBe("a/b/c");
    });

    it("ignores null/undefined/empty segments and normalizes separators", () => {
      expect(join("a\\b", undefined as any, "c\\d", null as any, "")).toBe("a/b/c/d");
      expect(join(undefined as any, null as any, "")).toBe(".");
    });
  });

  describe("normalize()", () => {
    it("collapses '.', '..' and redundant slashes", () => {
      expect(normalize("a//b/./c/..")).toBe("a/b");
      expect(normalize("/a//b///c")).toBe("/a/b/c");
    });
  });

  describe("dirname()", () => {
    runDirnameTests(dirname, [
      ...commonDirnameTestCases,
      ...pathSpecificDirnameTestCases,
    ]);
  });

  describe("basename()", () => {
    runBasenameTests(basename, [
      ...commonBasenameTestCases,
      ...pathSpecificBasenameTestCases,
    ]);
  });

  describe("extname()", () => {
    it("returns extension with leading dot or empty string", () => {
      expect(extname("a/b/c.txt")).toBe(".txt");
      expect(extname("archive.tar.gz")).toBe(".gz");
      expect(extname("noext")).toBe("");
      expect(extname(".env")).toBe("");
    });
  });

  describe("ensureLeadingSlash()", () => {
    it("adds exactly one leading slash", () => {
      expect(ensureLeadingSlash("a/b")).toBe("/a/b");
      expect(ensureLeadingSlash("//a/b")).toBe("/a/b");
      expect(ensureLeadingSlash("/")).toBe("/");
    });
  });

  describe("stripLeadingSlash()", () => {
    it("removes all leading slashes", () => {
      expect(stripLeadingSlash("/a/b")).toBe("a/b");
      expect(stripLeadingSlash("///a")).toBe("a");
      expect(stripLeadingSlash("a/b")).toBe("a/b");
    });
  });

  describe("ensureTrailingSlash()", () => {
    it("adds exactly one trailing slash", () => {
      expect(ensureTrailingSlash("a/b")).toBe("a/b/");
      expect(ensureTrailingSlash("a/b///")).toBe("a/b/");
      expect(ensureTrailingSlash("/")).toBe("/");
    });
  });

  describe("stripTrailingSlash()", () => {
    it("removes all trailing slashes", () => {
      expect(stripTrailingSlash("a/b///")).toBe("a/b");
      expect(stripTrailingSlash("a/b")).toBe("a/b");
      expect(stripTrailingSlash("/")).toBe("/");
    });
  });

  describe("isSubpath()", () => {
    it("returns true only when child is strictly inside parent", () => {
      expect(isSubpath("/a/b", "/a/b/c/d")).toBe(true);   // inside
      expect(isSubpath("/a/b", "/a/b")).toBe(false);      // same path -> false
      expect(isSubpath("/a/b", "/a/x")).toBe(false);      // sibling -> ../x
      expect(isSubpath("/a/b", "/a/bc")).toBe(false);     // prefix but not subdir -> ../bc
    });
  });

  describe("split()", () => {
    it("splits normalized path into non-empty segments", () => {
      expect(split("/a//b/c/")).toEqual(["a", "b", "c"]);
      expect(split("///")).toEqual([]);
      expect(split("a/b")).toEqual(["a", "b"]);
    });
  });
});
