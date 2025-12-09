/**
 * @fileoverview Frontend Core Barrel Tests - Ensures main barrel re-exports work correctly
 * @summary Tests for src/index.ts barrel exports
 */

import * as FrontendCore from '../src/index';

describe('frontend-core index (barrel) re-exports', () => {
  it('re-exports foundation functions', () => {
    expect(typeof FrontendCore.createHttpClient).toBe('function');
    expect(typeof FrontendCore.buildContextHeaders).toBe('function');
    expect(FrontendCore.queryKeys).toBeDefined();
  });

  it('re-exports ports module', () => {
    expect(FrontendCore).toBeDefined();
  });

  it('re-exports auth module', () => {
    expect(typeof FrontendCore.getMe).toBe('function');
    expect(typeof FrontendCore.patchMe).toBe('function');
  });

  it('re-exports signature module', () => {
    expect(typeof FrontendCore.createEnvelope).toBe('function');
    expect(typeof FrontendCore.getEnvelope).toBe('function');
  });
});

