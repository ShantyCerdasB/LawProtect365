/**
 * @fileoverview StrategyRegistry Tests - Unit tests for StrategyRegistry
 * @summary Tests for strategy registry
 * @description Comprehensive test suite for StrategyRegistry covering
 * registration, finding strategies, and processing events.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { StrategyRegistry } from '../../../../src/domain/strategies/StrategyRegistry';
import type { EventProcessingStrategy } from '../../../../src/domain/types/strategy';
import { eventTypeUnknown } from '../../../../src/notification-errors';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('StrategyRegistry', () => {
  let registry: StrategyRegistry;
  let mockStrategy1: EventProcessingStrategy;
  let mockStrategy2: EventProcessingStrategy;

  beforeEach(() => {
    registry = new StrategyRegistry();
    mockStrategy1 = {
      canHandle: jest.fn((eventType: string, source: string) => 
        eventType === 'TYPE1' && source === 'SOURCE1'
      ),
      process: jest.fn().mockResolvedValue([{ channel: 'EMAIL', recipient: 'test1@example.com' }]),
    };
    mockStrategy2 = {
      canHandle: jest.fn((eventType: string, source: string) => 
        eventType === 'TYPE2' && source === 'SOURCE2'
      ),
      process: jest.fn().mockResolvedValue([{ channel: 'EMAIL', recipient: 'test2@example.com' }]),
    };
  });

  describe('register', () => {
    it('registers a single strategy', () => {
      registry.register(mockStrategy1);
      const strategy = registry.findStrategy('TYPE1', 'SOURCE1');
      expect(strategy).toBe(mockStrategy1);
    });

    it('registers multiple strategies', () => {
      registry.register(mockStrategy1);
      registry.register(mockStrategy2);
      expect(registry.findStrategy('TYPE1', 'SOURCE1')).toBe(mockStrategy1);
      expect(registry.findStrategy('TYPE2', 'SOURCE2')).toBe(mockStrategy2);
    });
  });

  describe('registerAll', () => {
    it('registers multiple strategies at once', () => {
      registry.registerAll([mockStrategy1, mockStrategy2]);
      expect(registry.findStrategy('TYPE1', 'SOURCE1')).toBe(mockStrategy1);
      expect(registry.findStrategy('TYPE2', 'SOURCE2')).toBe(mockStrategy2);
    });
  });

  describe('findStrategy', () => {
    it('finds strategy that can handle event', () => {
      registry.register(mockStrategy1);
      const strategy = registry.findStrategy('TYPE1', 'SOURCE1');
      expect(strategy).toBe(mockStrategy1);
    });

    it('returns undefined when no strategy can handle event', () => {
      registry.register(mockStrategy1);
      const strategy = registry.findStrategy('UNKNOWN', 'SOURCE1');
      expect(strategy).toBeUndefined();
    });
  });

  describe('process', () => {
    it('processes event using found strategy', async () => {
      registry.register(mockStrategy1);
      const payload = { email: 'test@example.com' };
      const metadata = { eventType: 'TYPE1' };

      const result = await registry.process('TYPE1', 'SOURCE1', payload, metadata);

      expect(mockStrategy1.process).toHaveBeenCalledWith(payload, metadata);
      expect(result).toEqual([{ channel: 'EMAIL', recipient: 'test1@example.com' }]);
    });

    it('throws error when no strategy can handle event', async () => {
      const payload = { email: 'test@example.com' };

      await expect(registry.process('UNKNOWN', 'SOURCE', payload)).rejects.toThrow(BadRequestError);
    });
  });
});

