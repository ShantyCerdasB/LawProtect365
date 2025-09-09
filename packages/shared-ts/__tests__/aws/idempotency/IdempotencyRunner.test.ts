/**
 * @file IdempotencyRunner.test.ts
 * @summary Tests for IdempotencyRunner
 */

import { IdempotencyRunner } from '../../../src/aws/idempotency/IdempotencyRunner.js';
import { ConflictError, ErrorCodes } from '../../../src/errors/index.js';
import type { IdempotencyStore } from '../../../src/contracts/index.js';

describe('IdempotencyRunner', () => {
  let mockStore: jest.Mocked<IdempotencyStore>;
  let runner: IdempotencyRunner;

  beforeEach(() => {
    mockStore = {
      get: jest.fn(),
      putPending: jest.fn(),
      putCompleted: jest.fn(),
    } as any;

    runner = new IdempotencyRunner(mockStore);
  });

  describe('constructor', () => {
    it('should set default TTL to 300 seconds when not provided', () => {
      const runner = new IdempotencyRunner(mockStore);
      expect(runner).toBeDefined();
    });

    it('should use provided default TTL', () => {
      const runner = new IdempotencyRunner(mockStore, { defaultTtlSeconds: 600 });
      expect(runner).toBeDefined();
    });

    it('should clamp TTL to minimum of 1 second', () => {
      const runner = new IdempotencyRunner(mockStore, { defaultTtlSeconds: 0 });
      expect(runner).toBeDefined();
    });

    it('should handle negative TTL values', () => {
      const runner = new IdempotencyRunner(mockStore, { defaultTtlSeconds: -100 });
      expect(runner).toBeDefined();
    });
  });

  describe('run', () => {
    const testKey = 'test-key-123';
    const testResult = { id: 'result-456', data: 'test data' };
    const mockFn = jest.fn();

    beforeEach(() => {
      mockFn.mockClear();
    });

    it('should execute function and return result on first call', async () => {
      mockStore.get.mockResolvedValue(null);
      mockStore.putPending.mockResolvedValue(undefined);
      mockStore.putCompleted.mockResolvedValue(undefined);
      mockFn.mockResolvedValue(testResult);

      const result = await runner.run(testKey, mockFn);

      expect(result).toEqual(testResult);
      expect(mockStore.get).toHaveBeenCalledWith(testKey);
      expect(mockStore.putPending).toHaveBeenCalledWith(testKey, 300);
      expect(mockStore.putCompleted).toHaveBeenCalledWith(testKey, testResult, 300);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should use custom TTL when provided', async () => {
      mockStore.get.mockResolvedValue(null);
      mockStore.putPending.mockResolvedValue(undefined);
      mockStore.putCompleted.mockResolvedValue(undefined);
      mockFn.mockResolvedValue(testResult);

      await runner.run(testKey, mockFn, 600);

      expect(mockStore.putPending).toHaveBeenCalledWith(testKey, 600);
      expect(mockStore.putCompleted).toHaveBeenCalledWith(testKey, testResult, 600);
    });

    it('should clamp custom TTL to minimum of 1 second', async () => {
      mockStore.get.mockResolvedValue(null);
      mockStore.putPending.mockResolvedValue(undefined);
      mockStore.putCompleted.mockResolvedValue(undefined);
      mockFn.mockResolvedValue(testResult);

      await runner.run(testKey, mockFn, 0);

      expect(mockStore.putPending).toHaveBeenCalledWith(testKey, 1);
      expect(mockStore.putCompleted).toHaveBeenCalledWith(testKey, testResult, 1);
    });

    it('should throw ConflictError when request is pending', async () => {
      mockStore.get.mockResolvedValue('pending');

      await expect(runner.run(testKey, mockFn)).rejects.toThrow(ConflictError);
      
      try {
        await runner.run(testKey, mockFn);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictError);
        expect((error as ConflictError).message).toBe('Idempotent request is already in progress');
        expect((error as ConflictError).code).toBe(ErrorCodes.COMMON_CONFLICT);
      }

      expect(mockStore.putPending).not.toHaveBeenCalled();
      expect(mockStore.putCompleted).not.toHaveBeenCalled();
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when request is completed', async () => {
      mockStore.get.mockResolvedValue('completed');

      await expect(runner.run(testKey, mockFn)).rejects.toThrow(ConflictError);
      
      try {
        await runner.run(testKey, mockFn);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictError);
        expect((error as ConflictError).message).toBe('Idempotent request has already been processed');
        expect((error as ConflictError).code).toBe(ErrorCodes.COMMON_CONFLICT);
      }

      expect(mockStore.putPending).not.toHaveBeenCalled();
      expect(mockStore.putCompleted).not.toHaveBeenCalled();
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should rethrow function errors without marking as completed', async () => {
      const functionError = new Error('Function failed');
      mockStore.get.mockResolvedValue(null);
      mockStore.putPending.mockResolvedValue(undefined);
      mockFn.mockRejectedValue(functionError);

      await expect(runner.run(testKey, mockFn)).rejects.toThrow(functionError);

      expect(mockStore.putPending).toHaveBeenCalledWith(testKey, 300);
      expect(mockStore.putCompleted).not.toHaveBeenCalled();
    });

    it('should handle store errors during putPending', async () => {
      const storeError = new Error('Store error');
      mockStore.get.mockResolvedValue(null);
      mockStore.putPending.mockRejectedValue(storeError);

      await expect(runner.run(testKey, mockFn)).rejects.toThrow(storeError);

      expect(mockFn).not.toHaveBeenCalled();
      expect(mockStore.putCompleted).not.toHaveBeenCalled();
    });

    it('should handle store errors during putCompleted', async () => {
      const storeError = new Error('Store error');
      mockStore.get.mockResolvedValue(null);
      mockStore.putPending.mockResolvedValue(undefined);
      mockStore.putCompleted.mockRejectedValue(storeError);
      mockFn.mockResolvedValue(testResult);

      await expect(runner.run(testKey, mockFn)).rejects.toThrow(storeError);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockStore.putPending).toHaveBeenCalledWith(testKey, 300);
    });

    it('should handle undefined state from store', async () => {
      mockStore.get.mockResolvedValue(null);
      mockStore.putPending.mockResolvedValue(undefined);
      mockStore.putCompleted.mockResolvedValue(undefined);
      mockFn.mockResolvedValue(testResult);

      const result = await runner.run(testKey, mockFn);

      expect(result).toEqual(testResult);
      expect(mockStore.putPending).toHaveBeenCalledWith(testKey, 300);
      expect(mockStore.putCompleted).toHaveBeenCalledWith(testKey, testResult, 300);
    });

    it('should handle function returning undefined', async () => {
      mockStore.get.mockResolvedValue(null);
      mockStore.putPending.mockResolvedValue(undefined);
      mockStore.putCompleted.mockResolvedValue(undefined);
      mockFn.mockResolvedValue(undefined);

      const result = await runner.run(testKey, mockFn);

      expect(result).toBeUndefined();
      expect(mockStore.putCompleted).toHaveBeenCalledWith(testKey, undefined, 300);
    });

    it('should handle function returning null', async () => {
      mockStore.get.mockResolvedValue(null);
      mockStore.putPending.mockResolvedValue(undefined);
      mockStore.putCompleted.mockResolvedValue(undefined);
      mockFn.mockResolvedValue(null);

      const result = await runner.run(testKey, mockFn);

      expect(result).toBeNull();
      expect(mockStore.putCompleted).toHaveBeenCalledWith(testKey, null, 300);
    });

    it('should handle function returning primitive values', async () => {
      mockStore.get.mockResolvedValue(null);
      mockStore.putPending.mockResolvedValue(undefined);
      mockStore.putCompleted.mockResolvedValue(undefined);
      mockFn.mockResolvedValue(42);

      const result = await runner.run(testKey, mockFn);

      expect(result).toBe(42);
      expect(mockStore.putCompleted).toHaveBeenCalledWith(testKey, 42, 300);
    });
  });
});
