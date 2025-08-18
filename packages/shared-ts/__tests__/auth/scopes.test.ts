/**
 * @file scopes.test.ts
 * @summary Tests for OAuth2 scope utilities.
 */

import { parseScopes, hasAllScopes, hasAnyScope } from '../../src/auth/scopes.js';

describe('parseScopes', () => {
  it('splits by spaces and trims', () => {
    expect(parseScopes('read:docs  write:docs   admin')).toEqual(['read:docs', 'write:docs', 'admin']);
  });

  it('returns empty array for undefined or empty', () => {
    expect(parseScopes(undefined)).toEqual([]);
    expect(parseScopes('')).toEqual([]);
  });
});

describe('hasAllScopes', () => {
  it('returns true when all are present', () => {
    expect(hasAllScopes(['a', 'b', 'c'], ['a', 'c'])).toBe(true);
  });

  it('returns false when one is missing', () => {
    expect(hasAllScopes(['a', 'b'], ['a', 'c'])).toBe(false);
  });

  it('handles undefined available', () => {
    expect(hasAllScopes(undefined, ['x'])).toBe(false);
  });
});

describe('hasAnyScope', () => {
  it('returns true when at least one matches', () => {
    expect(hasAnyScope(['a', 'b'], ['x', 'b', 'y'])).toBe(true);
  });

  it('returns false when none match', () => {
    expect(hasAnyScope(['a'], ['x', 'y'])).toBe(false);
  });

  it('handles undefined available', () => {
    expect(hasAnyScope(undefined, ['x'])).toBe(false);
  });
});
