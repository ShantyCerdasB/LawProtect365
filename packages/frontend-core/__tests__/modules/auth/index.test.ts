/**
 * @fileoverview Auth Module Barrel Tests - Ensures barrel re-exports work correctly
 * @summary Tests for modules/auth/index.ts barrel exports
 */

import * as AuthModule from '../../../src/modules/auth/index';
import * as AuthApiMod from '../../../src/modules/auth/api/index';

describe('modules/auth index (barrel) re-exports', () => {
  it('re-exports auth API', () => {
    expect(AuthModule.getMe).toBe(AuthApiMod.getMe);
  });

  it('smoke-tests exported functions', () => {
    expect(typeof AuthModule.getMe).toBe('function');
    expect(typeof AuthModule.patchMe).toBe('function');
  });
});

