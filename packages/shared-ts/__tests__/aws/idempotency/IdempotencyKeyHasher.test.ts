/**
 * @file IdempotencyKeyHasher.test.ts
 * @summary Tests for IdempotencyKeyHasher
 */

import { IdempotencyKeyHasher, type IdempotencyKeyInput } from '../../../src/aws/idempotency/IdempotencyKeyHasher.js';

describe('IdempotencyKeyHasher', () => {
  const baseInput: IdempotencyKeyInput = {
    method: 'POST',
    path: '/api/users',
    userId: 'user-456'};

  describe('derive', () => {
    it('should generate consistent keys for identical inputs', () => {
      const result1 = IdempotencyKeyHasher.derive(baseInput);
      const result2 = IdempotencyKeyHasher.derive(baseInput);
      
      expect(result1.key).toBe(result2.key);
      expect(result1.input).toEqual(result2.input);
    });

    it('should generate different keys for different inputs', () => {
      const input1 = { ...baseInput, method: 'GET' };
      const input2 = { ...baseInput, method: 'POST' };
      
      const result1 = IdempotencyKeyHasher.derive(input1);
      const result2 = IdempotencyKeyHasher.derive(input2);
      
      expect(result1.key).not.toBe(result2.key);
    });

    it('should normalize method to uppercase', () => {
      const input1 = { ...baseInput, method: 'post' };
      const input2 = { ...baseInput, method: 'POST' };
      
      const result1 = IdempotencyKeyHasher.derive(input1);
      const result2 = IdempotencyKeyHasher.derive(input2);
      
      expect(result1.key).toBe(result2.key);
    });

    it('should handle query parameters', () => {
      const input1 = { ...baseInput, query: { page: 1, limit: 10 } };
      const input2 = { ...baseInput, query: { limit: 10, page: 1 } }; // Different order
      
      const result1 = IdempotencyKeyHasher.derive(input1);
      const result2 = IdempotencyKeyHasher.derive(input2);
      
      expect(result1.key).toBe(result2.key);
    });

    it('should handle body parameters', () => {
      const input1 = { ...baseInput, body: { name: 'John', age: 30 } };
      const input2 = { ...baseInput, body: { age: 30, name: 'John' } }; // Different order
      
      const result1 = IdempotencyKeyHasher.derive(input1);
      const result2 = IdempotencyKeyHasher.derive(input2);
      
      expect(result1.key).toBe(result2.key);
    });

    it('should handle scope parameter', () => {
      const input1 = { ...baseInput, scope: 'admin' };
      const input2 = { ...baseInput, scope: 'user' };
      
      const result1 = IdempotencyKeyHasher.derive(input1);
      const result2 = IdempotencyKeyHasher.derive(input2);
      
      expect(result1.key).not.toBe(result2.key);
    });

    it('should handle undefined optional parameters', () => {
      const input1 = { ...baseInput, query: undefined, body: undefined, scope: undefined };
      const input2 = { ...baseInput }; // No optional parameters
      
      const result1 = IdempotencyKeyHasher.derive(input1);
      const result2 = IdempotencyKeyHasher.derive(input2);
      
      expect(result1.key).toBe(result2.key);
    });

    it('should handle null optional parameters', () => {
      const input1 = { ...baseInput, query: null as any, body: null as any, scope: null as any };
      const input2 = { ...baseInput, query: undefined, body: undefined, scope: undefined };
      
      const result1 = IdempotencyKeyHasher.derive(input1);
      const result2 = IdempotencyKeyHasher.derive(input2);
      
      expect(result1.key).toBe(result2.key);
    });

    it('should generate valid SHA-256 hex keys', () => {
      const result = IdempotencyKeyHasher.derive(baseInput);
      
      expect(result.key).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should return input in result for debugging', () => {
      const result = IdempotencyKeyHasher.derive(baseInput);
      
      expect(result.input).toEqual(baseInput);
    });

    it('should handle complex nested objects', () => {
      const complexInput = {
        ...baseInput,
        query: {
          filters: { status: 'active', category: 'premium' },
          sort: { field: 'created_at', order: 'desc' }},
        body: {
          user: { name: 'John', profile: { age: 30, city: 'NYC' } },
          metadata: { source: 'web', version: '1.0' }}};
      
      const result = IdempotencyKeyHasher.derive(complexInput);
      
      expect(result.key).toMatch(/^[a-f0-9]{64}$/);
      expect(result.input).toEqual(complexInput);
    });

    it('should handle empty strings and special characters', () => {
      const specialInput = {
        ...baseInput,
        path: '/api/users/123?test=value&empty=',
        query: { empty: '', special: '!@#$%^&*()' },
        body: { unicode: '🚀', newline: 'line1\nline2' }};
      
      const result = IdempotencyKeyHasher.derive(specialInput);
      
      expect(result.key).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
