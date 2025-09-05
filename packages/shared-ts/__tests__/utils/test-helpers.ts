/**
 * @file test-helpers.ts
 * @summary Shared test utilities for path and S3 utility functions
 * @description Provides reusable test patterns and data for testing path manipulation functions
 */

/**
 * Test cases for dirname function testing
 */
export interface DirnameTestCase {
  input: string;
  expected: string;
  description: string;
}

/**
 * Test cases for basename function testing
 */
export interface BasenameTestCase {
  input: string;
  expected: string;
  description: string;
}

/**
 * Common test cases for dirname function
 * These represent the shared behavior that both path.ts and s3.ts should handle
 */
export const commonDirnameTestCases: DirnameTestCase[] = [
  {
    input: "a/b/c.txt",
    expected: "a/b",
    description: "returns directory portion for nested path"
  },
  {
    input: "single",
    expected: "",
    description: "returns empty string for single segment"
  }
];

/**
 * Common test cases for basename function
 * These represent the shared behavior that both path.ts and s3.ts should handle
 */
export const commonBasenameTestCases: BasenameTestCase[] = [
  {
    input: "a/b/c.txt",
    expected: "c.txt",
    description: "returns last segment for nested path"
  },
  {
    input: "name",
    expected: "name",
    description: "returns name for single segment"
  }
];

/**
 * Path-specific test cases for dirname function
 * These test the specific behavior of Node.js path.posix.dirname
 */
export const pathSpecificDirnameTestCases: DirnameTestCase[] = [
  {
    input: "a\\b\\c.txt",
    expected: "a/b",
    description: "handles backslashes (converted to forward slashes)"
  }
];

/**
 * Path-specific test cases for basename function
 * These test the specific behavior of Node.js path.posix.basename
 */
export const pathSpecificBasenameTestCases: BasenameTestCase[] = [
  {
    input: "a/b/",
    expected: "b",
    description: "handles trailing slash (returns last non-empty segment)"
  },
  {
    input: "a\\b\\",
    expected: "b",
    description: "handles backslashes with trailing slash"
  }
];

/**
 * S3-specific test cases for dirname function
 * These test the specific behavior of the custom S3 dirname implementation
 */
export const s3SpecificDirnameTestCases: DirnameTestCase[] = [
  {
    input: "/leading",
    expected: "",
    description: "idx === 0 yields empty per implementation"
  }
];

/**
 * S3-specific test cases for basename function
 * These test the specific behavior of the custom S3 basename implementation
 */
export const s3SpecificBasenameTestCases: BasenameTestCase[] = [
  {
    input: "a/b/",
    expected: "",
    description: "trailing slash yields empty string per implementation"
  }
];

/**
 * Helper function to run dirname test cases
 * @param dirnameFn The dirname function to test
 * @param testCases Array of test cases to run
 */
export const runDirnameTests = (
  dirnameFn: (input: string) => string,
  testCases: DirnameTestCase[]
): void => {
  testCases.forEach(({ input, expected, description }) => {
    it(description, () => {
      expect(dirnameFn(input)).toBe(expected);
    });
  });
};

/**
 * Helper function to run basename test cases
 * @param basenameFn The basename function to test
 * @param testCases Array of test cases to run
 */
export const runBasenameTests = (
  basenameFn: (input: string) => string,
  testCases: BasenameTestCase[]
): void => {
  testCases.forEach(({ input, expected, description }) => {
    it(description, () => {
      expect(basenameFn(input)).toBe(expected);
    });
  });
};
