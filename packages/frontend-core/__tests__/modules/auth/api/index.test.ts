/**
 * @fileoverview Auth API Barrel Tests - Ensures barrel re-exports work correctly
 * @summary Tests for modules/auth/api/index.ts barrel exports
 */

import * as AuthApi from '../../../../src/modules/auth/api/index';

describe('modules/auth/api index (barrel) re-exports', () => {
  it('re-exports all auth API functions', () => {
    expect(typeof AuthApi.getMe).toBe('function');
    expect(typeof AuthApi.patchMe).toBe('function');
    expect(typeof AuthApi.linkProvider).toBe('function');
    expect(typeof AuthApi.unlinkProvider).toBe('function');
  });
});

