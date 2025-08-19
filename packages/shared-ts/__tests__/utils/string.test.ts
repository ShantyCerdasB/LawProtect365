/**
 * @file Tests for string utilities in utils/strings.ts
 * @remarks
 * - Drives 100% coverage including branches.
 */

import {
  isBlank,
  normalizeWhitespace,
  trimTo,
  toTitleCase,
  slugify,
  stripControlChars,
  leftPad,
} from "../../src/utils/string";

describe("utils/strings", () => {
  describe("isBlank()", () => {
    it("detects blank/whitespace values", () => {
      expect(isBlank(undefined)).toBe(true);
      expect(isBlank(null)).toBe(true);
      expect(isBlank("")).toBe(true);
      expect(isBlank("   ")).toBe(true);
      expect(isBlank(" a ")).toBe(false);
    });
  });

  describe("normalizeWhitespace()", () => {
    it("collapses runs and trims", () => {
      expect(normalizeWhitespace("  a\tb \n c  ")).toBe("a b c");
      expect(normalizeWhitespace("single")).toBe("single");
    });
  });

  describe("trimTo()", () => {
    it("returns original when within max", () => {
      expect(trimTo("hello", 5)).toBe("hello");
    });

    it("truncates and appends default suffix", () => {
      // Implementation keeps total length <= max by slicing to (max - suffix.length)
      expect(trimTo("helloworld", 7)).toBe("hellow…");
    });

    it("uses custom suffix and guards negative slice", () => {
      expect(trimTo("abcdef", 3, "..")).toBe("a..");
      expect(trimTo("abcdef", 1, "___")).toBe("___"); // Math.max(0, negative)
    });
  });

  describe("toTitleCase()", () => {
    it("capitalizes word initials (ASCII)", () => {
      expect(toTitleCase("hello world")).toBe("Hello World");
      expect(toTitleCase("fOO bAr")).toBe("Foo Bar");
      expect(toTitleCase("dash-separated words")).toBe("Dash-Separated Words");
    });
  });

  describe("slugify()", () => {
    it("handles diacritics, punctuation, and hyphen trimming", () => {
      expect(slugify("Crème brûlée!")).toBe("creme-brulee");
      expect(slugify("  --Hello__World--  ")).toBe("hello-world");
      // Non-alphanumerics (including '/') collapse to hyphens; diacritics are stripped
      expect(slugify("ÁÉÍ Ó/Ü ~~~ ###")).toBe("aei-o-u");
    });

    it("collapses consecutive non-alphanumerics to one dash", () => {
      expect(slugify("a***b___c===d")).toBe("a-b-c-d");
      expect(slugify("a////b////c")).toBe("a-b-c");
    });

    it("returns empty string when no alphanumerics", () => {
      expect(slugify("-----")).toBe("");
      expect(slugify("   ")).toBe("");
    });
  });

  describe("stripControlChars()", () => {
    it("removes ASCII control characters", () => {
      const s = "ok\u0000middle\u001Fend\u007F!";
      expect(stripControlChars(s)).toBe("okmiddleend!");
      expect(stripControlChars("plain")).toBe("plain");
    });
  });

  describe("leftPad()", () => {
    it("pads to desired length with given char", () => {
      expect(leftPad("7", 3, "0")).toBe("007");
      expect(leftPad("abc", 2, ".")).toBe("abc");
      expect(leftPad("x", 4)).toBe("   x");
    });
  });
});
