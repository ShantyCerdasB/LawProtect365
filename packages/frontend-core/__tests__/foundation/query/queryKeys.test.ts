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

  describe('signature.envelopes', () => {
    it('should generate query key with params (line 10)', () => {
      const key = queryKeys.signature.envelopes({ status: 'sent', limit: 10 });
      
      expect(key).toEqual(['signature', 'envelopes', { status: 'sent', limit: 10 }]);
      expect(Array.isArray(key)).toBe(true);
    });

    it('should generate query key without params', () => {
      const key = queryKeys.signature.envelopes();
      
      expect(key).toEqual(['signature', 'envelopes', undefined]);
    });

    it('should generate query key with cursor', () => {
      const key = queryKeys.signature.envelopes({ cursor: 'cursor-123' });
      
      expect(key).toEqual(['signature', 'envelopes', { cursor: 'cursor-123' }]);
    });
  });

  describe('signature.envelope', () => {
    it('should generate query key with envelopeId and params (line 11-12)', () => {
      const key = queryKeys.signature.envelope('env-1', { invitationToken: 'token-123' });
      
      expect(key).toEqual(['signature', 'envelope', 'env-1', { invitationToken: 'token-123' }]);
      expect(Array.isArray(key)).toBe(true);
    });

    it('should generate query key with envelopeId only', () => {
      const key = queryKeys.signature.envelope('env-1');
      
      expect(key).toEqual(['signature', 'envelope', 'env-1', undefined]);
    });
  });

  describe('signature.auditTrail', () => {
    it('should generate query key with envelopeId (line 13-14)', () => {
      const key = queryKeys.signature.auditTrail('env-1');
      
      expect(key).toEqual(['signature', 'audit-trail', 'env-1']);
      expect(Array.isArray(key)).toBe(true);
    });
  });
});

