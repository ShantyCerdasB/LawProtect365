/**
 * @fileoverview Query Keys Tests - Unit tests for React Query keys
 * @summary Tests for queryKeys object
 */

import { queryKeys } from '../../../src/foundation/query/queryKeys';

describe('queryKeys', () => {
  it('should have auth.me key', () => {
    expect(queryKeys.auth.me).toEqual(['auth', 'me']);
  });

  it('should have readonly keys', () => {
    const keys = queryKeys.auth.me;
    
    // Keys should be readonly tuples
    expect(Array.isArray(keys)).toBe(true);
    expect(keys.length).toBe(2);
    expect(keys[0]).toBe('auth');
    expect(keys[1]).toBe('me');
  });

  it('should be usable as query key in React Query', () => {
    // This is a type/usage test - query keys should be valid for React Query
    const key = queryKeys.auth.me;
    
    expect(key).toEqual(['auth', 'me']);
    // React Query accepts arrays as keys
    expect(Array.isArray(key)).toBe(true);
  });
});

