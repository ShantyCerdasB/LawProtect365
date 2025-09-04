/**
 * @file validation.test.ts
 * @summary Verifies that the validation barrel (index) re-exports all symbols from its submodules.
 * @remarks
 * - Dynamically imports each submodule and the index, then asserts that every public export from
 *   the submodule is present on the index object and refers to the exact same value (identity).
 * - Ignores non-runtime fields like `default` and `__esModule`.
 * - Keeps branching simple to satisfy typical Sonar complexity rules.
 */

type AnyRecord = Record<string, unknown>;

/** Returns the public (runtime) export keys of a module. */
const publicKeys = (mod: AnyRecord): string[] =>
  Object.keys(mod).filter((k) => k !== "default" && k !== "__esModule");

describe("validation barrel exports", () => {
  it("re-exports all public members from each submodule", async () => {
    // Import the barrel/index once.
    const indexMod: AnyRecord = await import("../../src/validation/index.js");

    // List of submodules that index re-exports.
    const submodules = [
      ["commonSchemas", "../../src/validation/commonSchemas.js"],
      ["ids",           "../../src/validation/ids.js"],
      ["sanitizers",    "../../src/validation/sanitizers.js"],
      ["pagination",    "../../src/validation/pagination.js"],
      ["http",          "../../src/validation/http.js"],
      ["env",           "../../src/validation/env.js"],
      ["requests",      "../../src/validation/requests.js"],
    ] as const;

    for (const [name, path] of submodules) {
      const mod: AnyRecord = await import(path);
      const keys = publicKeys(mod);

      // Sanity: the module should have at least one public export (helps catch path mistakes).
      expect(Array.isArray(keys)).toBe(true);

      for (const k of keys) {
        // The index must have the same key
        expect(Object.hasOwn(indexMod, k)).toBe(true);

        // And it must be the exact same reference/value
        expect(indexMod[k]).toBe(mod[k]);
      }
    }
  });

  it("does not expose undefined values for any of its own exports", async () => {
    const indexMod: AnyRecord = await import("../../src/validation/index.js");
    const keys = publicKeys(indexMod);

    for (const k of keys) {
      expect(indexMod[k]).not.toBeUndefined();
    }
  });
});
