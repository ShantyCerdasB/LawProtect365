/**
 * @file utils.index.test.ts
 * @summary Verifies that the utils barrel re-exports every symbol from its submodules (including aliased members).
 * @remarks
 * - Marks the file as a module via `export {}` to avoid global-scope collisions across test files.
 * - Uses unique identifier names (prefixed with `UTILS_`) to prevent duplicate identifiers.
 */
export {};

const UTILS_BARREL_PATH = '../../src/utils/index.js';

const UTILS_MODULES = {
  s3: '../../src/utils/s3.js',
  path: '../../src/utils/path.js',
  json: '../../src/utils/json.js',
  date: '../../src/utils/date.js',
  string: '../../src/utils/string.js',
  array: '../../src/utils/array.js',
  object: '../../src/utils/object.js',
  env: '../../src/utils/env.js',
  id: '../../src/utils/id.js',
  promise: '../../src/utils/promise.js',
  validation: '../../src/utils/validation.js',
  crypto: '../../src/utils/crypto.js',
  math: '../../src/utils/math.js',
  security: '../../src/utils/security.js',
} as const;

type UtilsModuleExports = Record<string, unknown>;

const utilsPublicKeys = (m: UtilsModuleExports) =>
  Object.keys(m).filter((k) => k !== 'default' && k !== '__esModule');

describe('utils barrel (src/utils/index.ts)', () => {
  it('has no default export and exposes some symbols', async () => {
    const barrel: UtilsModuleExports = await import(UTILS_BARREL_PATH);
    expect('default' in barrel).toBe(false);

    const keys = utilsPublicKeys(barrel);
    expect(Array.isArray(keys)).toBe(true);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('re-exports all non-aliased symbols from each submodule', async () => {
    const barrel: UtilsModuleExports = await import(UTILS_BARREL_PATH);

    // s3: exclude basename/dirname (aliased) from generic verification
    {
      const mod: UtilsModuleExports = await import(UTILS_MODULES.s3);
      const keys = utilsPublicKeys(mod).filter((k) => k !== 'basename' && k !== 'dirname');
      for (const k of keys) {
        expect(barrel).toHaveProperty(k);
        expect(barrel[k]).toBe(mod[k]);
      }
    }

    // path: exclude basename/dirname (aliased) from generic verification
    {
      const mod: UtilsModuleExports = await import(UTILS_MODULES.path);
      const keys = utilsPublicKeys(mod).filter((k) => k !== 'basename' && k !== 'dirname');
      for (const k of keys) {
        expect(barrel).toHaveProperty(k);
        expect(barrel[k]).toBe(mod[k]);
      }
    }

    // Star-reexported modules: verify all their public keys appear verbatim.
    const starModules = [
      UTILS_MODULES.json,
      UTILS_MODULES.date,
      UTILS_MODULES.string,
      UTILS_MODULES.array,
      UTILS_MODULES.object,
      UTILS_MODULES.env,
      UTILS_MODULES.id,
      UTILS_MODULES.promise,
      UTILS_MODULES.validation,
      UTILS_MODULES.crypto,
      UTILS_MODULES.math,
      UTILS_MODULES.security,
    ];

    for (const p of starModules) {
      const mod: UtilsModuleExports = await import(p);
      for (const k of utilsPublicKeys(mod)) {
        expect(barrel).toHaveProperty(k);
        expect(barrel[k]).toBe(mod[k]);
      }
    }
  });

  it('correctly maps aliased exports for s3 and path', async () => {
    const barrel: UtilsModuleExports = await import(UTILS_BARREL_PATH);
    const s3: UtilsModuleExports = await import(UTILS_MODULES.s3);
    const pathMod: UtilsModuleExports = await import(UTILS_MODULES.path);

    expect(barrel).toHaveProperty('s3Basename');
    expect(barrel.s3Basename).toBe(s3.basename);

    expect(barrel).toHaveProperty('s3Dirname');
    expect(barrel.s3Dirname).toBe(s3.dirname);

    expect(barrel).toHaveProperty('pathBasename');
    expect(barrel.pathBasename).toBe(pathMod.basename);

    expect(barrel).toHaveProperty('pathDirname');
    expect(barrel.pathDirname).toBe(pathMod.dirname);
  });

  it('exports exactly the union of expected symbols (accounting for aliases)', async () => {
    const barrel: UtilsModuleExports = await import(UTILS_BARREL_PATH);
    const barrelKeys = utilsPublicKeys(barrel).sort();

    // Build the expected union:
    const expected = new Set<string>();

    // s3: include all keys but rename basename/dirname
    {
      const s3: UtilsModuleExports = await import(UTILS_MODULES.s3);
      for (const k of utilsPublicKeys(s3)) {
        if (k === 'basename') expected.add('s3Basename');
        else if (k === 'dirname') expected.add('s3Dirname');
        else expected.add(k);
      }
    }

    // path: include all keys but rename basename/dirname
    {
      const pathMod: UtilsModuleExports = await import(UTILS_MODULES.path);
      for (const k of utilsPublicKeys(pathMod)) {
        if (k === 'basename') expected.add('pathBasename');
        else if (k === 'dirname') expected.add('pathDirname');
        else expected.add(k);
      }
    }

    // Star re-exports: include all keys as-is
    const starModules = [
      UTILS_MODULES.json,
      UTILS_MODULES.date,
      UTILS_MODULES.string,
      UTILS_MODULES.array,
      UTILS_MODULES.object,
      UTILS_MODULES.env,
      UTILS_MODULES.id,
      UTILS_MODULES.promise,
      UTILS_MODULES.validation,
      UTILS_MODULES.crypto,
      UTILS_MODULES.math,
      UTILS_MODULES.security,
    ];
    for (const p of starModules) {
      const mod: UtilsModuleExports = await import(p);
      utilsPublicKeys(mod).forEach((k) => expected.add(k));
    }

    const expectedKeys = Array.from(expected).sort();

    expect(barrelKeys).toEqual(expectedKeys);
  });
});
