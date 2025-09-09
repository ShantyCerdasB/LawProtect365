import { toTtl, toDdbItem, stringifyResult } from '../../src/utils/idempotency.js';

describe('Idempotency Utils', () => {
  describe('toTtl', () => {
    it('should convert positive TTL to epoch seconds', () => {
      const ttlSeconds = 3600; // 1 hour
      const result = toTtl(ttlSeconds);
      const expected = Math.floor(Date.now() / 1000) + 3600;
      expect(result).toBe(expected);
    });

    it('should return undefined for zero TTL', () => {
      const result = toTtl(0);
      expect(result).toBeUndefined();
    });

    it('should return undefined for negative TTL', () => {
      const result = toTtl(-100);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
      const result = toTtl(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined for null input', () => {
      const result = toTtl(null as any);
      expect(result).toBeUndefined();
    });

    it('should floor fractional TTL values', () => {
      const ttlSeconds = 3600.7;
      const result = toTtl(ttlSeconds);
      const expected = Math.floor(Date.now() / 1000) + 3600;
      expect(result).toBe(expected);
    });

    it('should handle very small positive TTL', () => {
      const ttlSeconds = 0.1;
      const result = toTtl(ttlSeconds);
      const expected = Math.floor(Date.now() / 1000) + 0;
      expect(result).toBe(expected);
    });

    it('should handle very large TTL', () => {
      const ttlSeconds = 365 * 24 * 60 * 60; // 1 year
      const result = toTtl(ttlSeconds);
      const expected = Math.floor(Date.now() / 1000) + ttlSeconds;
      expect(result).toBe(expected);
    });
  });

  describe('toDdbItem', () => {
    it('should convert object to DynamoDB item shape', () => {
      const input = { id: '123', name: 'test', active: true };
      const result = toDdbItem(input);
      expect(result).toEqual(input);
      expect(result).toBe(input); // Should be the same reference
    });

    it('should handle empty object', () => {
      const input = {};
      const result = toDdbItem(input);
      expect(result).toEqual({});
    });

    it('should handle object with nested properties', () => {
      const input = {
        id: '123',
        metadata: { created: '2023-01-01', tags: ['tag1', 'tag2'] },
        count: 42,
      };
      const result = toDdbItem(input);
      expect(result).toEqual(input);
    });

    it('should handle object with special values', () => {
      const input = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0,
        falseValue: false,
      };
      const result = toDdbItem(input);
      expect(result).toEqual(input);
    });

    it('should preserve object reference', () => {
      const input = { test: 'value' };
      const result = toDdbItem(input);
      expect(result).toBe(input);
    });
  });

  describe('stringifyResult', () => {
    it('should stringify simple object', () => {
      const result = { success: true, data: 'test' };
      const stringified = stringifyResult(result);
      expect(stringified).toBe('{"data":"test","success":true}');
    });

    it('should stringify primitive values', () => {
      expect(stringifyResult('hello')).toBe('"hello"');
      expect(stringifyResult(123)).toBe('123');
      expect(stringifyResult(true)).toBe('true');
      expect(stringifyResult(null)).toBe('null');
    });

    it('should stringify arrays', () => {
      const result = [1, 2, 3, 'test'];
      const stringified = stringifyResult(result);
      expect(stringified).toBe('[1,2,3,"test"]');
    });

    it('should stringify nested objects', () => {
      const result = {
        level1: {
          level2: {
            value: 'deep'
          }
        }
      };
      const stringified = stringifyResult(result);
      expect(stringified).toBe('{"level1":{"level2":{"value":"deep"}}}');
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const stringified = stringifyResult(circular);
      expect(stringified).toBe('{"ok":false,"reason":"non-serializable-result"}');
    });

    it('should handle functions gracefully', () => {
      const withFunction = {
        name: 'test',
        fn: () => 'hello'
      };
      
      const stringified = stringifyResult(withFunction);
      expect(stringified).toBe('{"ok":false,"reason":"non-serializable-result"}');
    });

    it('should handle undefined gracefully', () => {
      const stringified = stringifyResult(undefined);
      expect(stringified).toBe('{"ok":false,"reason":"non-serializable-result"}');
    });

    it('should handle symbols gracefully', () => {
      const withSymbol = {
        name: 'test',
        symbol: Symbol('test')
      };
      
      const stringified = stringifyResult(withSymbol);
      expect(stringified).toBe('{"ok":false,"reason":"non-serializable-result"}');
    });

    it('should handle BigInt gracefully', () => {
      const withBigInt = {
        name: 'test',
        big: BigInt(123)
      };
      
      const stringified = stringifyResult(withBigInt);
      expect(stringified).toBe('{"ok":false,"reason":"non-serializable-result"}');
    });

    it('should handle complex valid objects', () => {
      const complex = {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: 'value' },
        date: new Date('2023-01-01T00:00:00.000Z')
      };
      
      const stringified = stringifyResult(complex);
      expect(stringified).toContain('"string":"hello"');
      expect(stringified).toContain('"number":42');
      expect(stringified).toContain('"boolean":true');
    });
  });
});
