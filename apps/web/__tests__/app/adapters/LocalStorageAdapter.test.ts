/**
 * @fileoverview LocalStorage Adapter Tests - Test suite for LocalStorageAdapter
 * @summary Tests localStorage operations and error handling
 * @description
 * Tests the LocalStorageAdapter including get, set, remove, clear operations,
 * JSON serialization/deserialization, error handling, and edge cases.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LocalStorageAdapter } from '@/app/adapters/LocalStorageAdapter';
import { createMockLocalStorage } from '@/__tests__/helpers';

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    adapter = new LocalStorageAdapter();
    mockStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
  });

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const result = await adapter.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return parsed JSON for valid JSON string', async () => {
      mockStorage.setItem('test-key', JSON.stringify({ name: 'test', value: 123 }));
      const result = await adapter.get<{ name: string; value: number }>('test-key');
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should return string value for non-JSON string', async () => {
      mockStorage.setItem('test-key', 'plain-string');
      const result = await adapter.get<string>('test-key');
      expect(result).toBe('plain-string');
    });

    it('should handle invalid JSON gracefully', async () => {
      mockStorage.setItem('test-key', '{ invalid json }');
      const result = await adapter.get('test-key');
      expect(result).toBe('{ invalid json }');
    });

    it('should handle empty string', async () => {
      mockStorage.setItem('test-key', '');
      const result = await adapter.get('test-key');
      expect(result).toBe('');
    });

    it('should handle complex nested objects', async () => {
      const complex = {
        level1: {
          level2: {
            level3: ['array', 'values'],
          },
        },
      };
      mockStorage.setItem('test-key', JSON.stringify(complex));
      const result = await adapter.get<typeof complex>('test-key');
      expect(result).toEqual(complex);
    });
  });

  describe('set', () => {
    it('should store string value as-is', async () => {
      await adapter.set('test-key', 'string-value');
      expect(mockStorage.setItem).toHaveBeenCalledWith('test-key', 'string-value');
    });

    it('should stringify and store object', async () => {
      const obj = { name: 'test', value: 123 };
      await adapter.set('test-key', obj);
      expect(mockStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(obj));
    });

    it('should stringify and store array', async () => {
      const arr = [1, 2, 3];
      await adapter.set('test-key', arr);
      expect(mockStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(arr));
    });

    it('should handle null value', async () => {
      await adapter.set('test-key', null);
      expect(mockStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(null));
    });

    it('should handle boolean values', async () => {
      await adapter.set('test-key', true);
      expect(mockStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(true));
    });

    it('should handle number values', async () => {
      await adapter.set('test-key', 42);
      expect(mockStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(42));
    });

    it('should overwrite existing value', async () => {
      mockStorage.setItem('test-key', 'old-value');
      await adapter.set('test-key', 'new-value');
      expect(mockStorage.setItem).toHaveBeenCalledWith('test-key', 'new-value');
    });
  });

  describe('remove', () => {
    it('should remove existing key', async () => {
      mockStorage.setItem('test-key', 'value');
      await adapter.remove('test-key');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle removing non-existent key', async () => {
      await adapter.remove('nonexistent');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('clear', () => {
    it('should clear all storage', async () => {
      mockStorage.setItem('key1', 'value1');
      mockStorage.setItem('key2', 'value2');
      await adapter.clear();
      expect(mockStorage.clear).toHaveBeenCalled();
    });

    it('should clear empty storage', async () => {
      await adapter.clear();
      expect(mockStorage.clear).toHaveBeenCalled();
    });
  });

  describe('roundtrip operations', () => {
    it('should get what was set for string', async () => {
      await adapter.set('test-key', 'test-value');
      const result = await adapter.get<string>('test-key');
      expect(result).toBe('test-value');
    });

    it('should get what was set for object', async () => {
      const obj = { name: 'test', count: 5 };
      await adapter.set('test-key', obj);
      const result = await adapter.get<typeof obj>('test-key');
      expect(result).toEqual(obj);
    });

    it('should handle set, get, remove cycle', async () => {
      await adapter.set('test-key', 'value');
      const getResult = await adapter.get('test-key');
      expect(getResult).toBe('value');

      await adapter.remove('test-key');
      const afterRemove = await adapter.get('test-key');
      expect(afterRemove).toBeNull();
    });
  });
});
