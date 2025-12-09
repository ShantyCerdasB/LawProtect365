/**
 * @fileoverview Signature Module Barrel Tests - Ensures barrel re-exports work correctly
 * @summary Tests for modules/signature/index.ts barrel exports
 */

import * as SignatureModule from '../../../src/modules/signature/index';
import * as SignatureApiMod from '../../../src/modules/signature/api/index';

describe('modules/signature index (barrel) re-exports', () => {
  it('re-exports signature API', () => {
    expect(SignatureModule.createEnvelope).toBe(SignatureApiMod.createEnvelope);
    expect(SignatureModule.getEnvelope).toBe(SignatureApiMod.getEnvelope);
  });
});

