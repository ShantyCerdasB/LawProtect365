/**
 * @file types.index.test.ts
 * @summary Verifies that the types barrel re-exports every symbol from its submodules.
 * @remarks
 * - In JS runtime, type-only exports are erased. If all submodules export only types,
 *   both the barrel and the union will have zero runtime keys, which is acceptable.
 */

const BARREL_PATH = '../../src/types/index.js';
const MODULE_PATHS = [
  '../../src/types/brand.js',
  '../../src/types/common.js',
  '../../src/types/auth.js',
  '../../src/types/api.js',
  '../../src/types/pagination.js',
  '../../src/types/events.js',
  '../../src/types/security.js',
  '../../src/types/corsConfig.js',
  '../../src/types/mapErrorOptions.js',
  '../../src/types/actor.js',
  '../../src/types/documentLock.js',
  '../../src/types/outbox.js',
  '../../src/types/response.js',
] as const;

type ModuleExports = Record<string, unknown>;

const publicKeys = (m: ModuleExports) =>
  Object.keys(m).filter((k) => k !== 'default' && k !== '__esModule');

describe('types barrel (src/types/index.ts)', () => {
  it('re-exports all symbols from each submodule', async () => {
    const barrel: ModuleExports = await import(BARREL_PATH);

    // Sanity check: should not have a default export
    expect('default' in barrel).toBe(false);

    for (const p of MODULE_PATHS) {
      const mod: ModuleExports = await import(p);
      const keys = publicKeys(mod);
      for (const k of keys) {
        expect(barrel).toHaveProperty(k);
        expect(barrel[k]).toBe(mod[k]);
      }
    }
  });

  it('exports exactly the union of all submodule exports', async () => {
    const barrel: ModuleExports = await import(BARREL_PATH);
    const barrelKeys = publicKeys(barrel).sort();

    const union = new Set<string>();
    for (const p of MODULE_PATHS) {
      const mod: ModuleExports = await import(p);
      publicKeys(mod).forEach((k) => union.add(k));
    }
    const unionKeys = Array.from(union).sort();

    // Must match exactly
    expect(barrelKeys).toEqual(unionKeys);

    // Only assert non-empty if the union itself has runtime exports.
    if (unionKeys.length > 0) {
      expect(barrelKeys.length).toBeGreaterThan(0);
    }
  });
});
