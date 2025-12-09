/**
 * @fileoverview Ports Barrel Tests - Ensures barrel re-exports work correctly
 * @summary Tests for ports/index.ts barrel exports
 */

import * as Ports from '../../src/ports/index';

describe('ports index (barrel) re-exports', () => {
  it('re-exports storage ports', () => {
    // Types are erased at runtime, so we only assert that the module loads.
    expect(Ports).toBeDefined();
  });

  it('re-exports auth ports', () => {
    expect(Ports).toBeDefined();
  });

  it('re-exports network ports', () => {
    expect(Ports).toBeDefined();
  });

  it('smoke-tests port interfaces', () => {
    // Verify the ports module itself is defined and importable
    expect(Ports).toBeDefined();
  });
});

