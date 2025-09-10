/**
 * @file Audit.rules.test.ts
 * @summary Tests for Audit rules
 */

import {
  assertImmutable,
  assertAscendingByTime,
  sameTenant,
  sameEnvelope,
  assertEventType,
  assertActorShape} from '../../src/rules/Audit.rules.js';
import { BadRequestError } from '../../src/errors/index.js';

describe('Audit.rules', () => {
  describe('assertImmutable', () => {
    it('should pass for valid audit event', () => {
      const validEvent = {
        id: 'event-123',
        occurredAt: '2023-01-01T00:00:00Z',
        type: 'UserCreated',
        actorId: 'actor-789'};

      expect(() => assertImmutable(validEvent)).not.toThrow();
    });

    it('should throw BadRequestError for null value', () => {
      expect(() => assertImmutable(null)).toThrow(BadRequestError);
      expect(() => assertImmutable(null)).toThrow('Invalid audit event value');
    });

    it('should throw BadRequestError for undefined value', () => {
      expect(() => assertImmutable(undefined)).toThrow(BadRequestError);
      expect(() => assertImmutable(undefined)).toThrow('Invalid audit event value');
    });

    it('should throw BadRequestError for non-object value', () => {
      expect(() => assertImmutable('string')).toThrow(BadRequestError);
      expect(() => assertImmutable(123)).toThrow(BadRequestError);
      expect(() => assertImmutable(true)).toThrow(BadRequestError);
      expect(() => assertImmutable([])).toThrow(BadRequestError);
    });

    it('should throw BadRequestError for missing id', () => {
      const event = {
        occurredAt: '2023-01-01T00:00:00Z',
        type: 'UserCreated'};

      expect(() => assertImmutable(event)).toThrow(BadRequestError);
      expect(() => assertImmutable(event)).toThrow('Invalid audit event shape');
    });

    it('should throw BadRequestError for missing occurredAt', () => {
      const event = {
        id: 'event-123',
        type: 'UserCreated'};

      expect(() => assertImmutable(event)).toThrow(BadRequestError);
      expect(() => assertImmutable(event)).toThrow('Invalid audit event shape');
    });

    it('should throw BadRequestError for missing type', () => {
      const event = {
        id: 'event-123',
        occurredAt: '2023-01-01T00:00:00Z'};

      expect(() => assertImmutable(event)).toThrow(BadRequestError);
      expect(() => assertImmutable(event)).toThrow('Invalid audit event shape');
    });

    it('should throw BadRequestError for empty string values', () => {
      const event = {
        id: '',
        occurredAt: '2023-01-01T00:00:00Z',
        type: 'UserCreated'};

      expect(() => assertImmutable(event)).toThrow(BadRequestError);
      expect(() => assertImmutable(event)).toThrow('Invalid audit event shape');
    });
  });

  describe('assertAscendingByTime', () => {
    it('should pass for properly ordered events', () => {
      const events = [
        { id: 'event-1', occurredAt: '2023-01-01T00:00:00Z' },
        { id: 'event-2', occurredAt: '2023-01-01T00:01:00Z' },
        { id: 'event-3', occurredAt: '2023-01-01T00:02:00Z' },
      ];

      expect(() => assertAscendingByTime(events)).not.toThrow();
    });

    it('should pass for empty array', () => {
      expect(() => assertAscendingByTime([])).not.toThrow();
    });

    it('should pass for single event', () => {
      const events = [{ id: 'event-1', occurredAt: '2023-01-01T00:00:00Z' }];
      expect(() => assertAscendingByTime(events)).not.toThrow();
    });

    it('should pass for events with same timestamp but different ids', () => {
      const events = [
        { id: 'event-1', occurredAt: '2023-01-01T00:00:00Z' },
        { id: 'event-2', occurredAt: '2023-01-01T00:00:00Z' },
      ];

      expect(() => assertAscendingByTime(events)).not.toThrow();
    });

    it('should throw BadRequestError for descending order', () => {
      const events = [
        { id: 'event-2', occurredAt: '2023-01-01T00:01:00Z' },
        { id: 'event-1', occurredAt: '2023-01-01T00:00:00Z' },
      ];

      expect(() => assertAscendingByTime(events)).toThrow(BadRequestError);
      expect(() => assertAscendingByTime(events)).toThrow('Audit events are not ordered by occurredAt ASC');
    });

    it('should throw BadRequestError for unstable ordering with same timestamp', () => {
      const events = [
        { id: 'event-2', occurredAt: '2023-01-01T00:00:00Z' },
        { id: 'event-1', occurredAt: '2023-01-01T00:00:00Z' },
      ];

      expect(() => assertAscendingByTime(events)).toThrow(BadRequestError);
      expect(() => assertAscendingByTime(events)).toThrow('Audit events are not stable-ordered (id tiebreaker)');
    });

    it('should handle mixed valid and invalid ordering', () => {
      const events = [
        { id: 'event-1', occurredAt: '2023-01-01T00:00:00Z' },
        { id: 'event-2', occurredAt: '2023-01-01T00:01:00Z' },
        { id: 'event-3', occurredAt: '2023-01-01T00:00:30Z' }, // Out of order
      ];

      expect(() => assertAscendingByTime(events)).toThrow(BadRequestError);
    });
  });

  describe('sameTenant', () => {
    it('should return true for matching tenant IDs', () => {
      expect(sameTenant('tenant-123', 'tenant-123')).toBe(true);
    });

    it('should return false for different tenant IDs', () => {
      expect(sameTenant('tenant-123', 'tenant-456')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(sameTenant('', 'tenant-123')).toBe(false);
      expect(sameTenant('tenant-123', '')).toBe(false);
      expect(sameTenant('', '')).toBe(true);
    });
  });

  describe('sameEnvelope', () => {
    it('should return true for matching envelope IDs', () => {
      expect(sameEnvelope('envelope-123', 'envelope-123')).toBe(true);
    });

    it('should return false for different envelope IDs', () => {
      expect(sameEnvelope('envelope-123', 'envelope-456')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(sameEnvelope('', 'envelope-123')).toBe(false);
      expect(sameEnvelope('envelope-123', '')).toBe(false);
      expect(sameEnvelope('', '')).toBe(true);
    });
  });

  describe('assertEventType', () => {
    it('should pass for valid event type', () => {
      expect(() => assertEventType('UserCreated')).not.toThrow();
    });

    it('should throw BadRequestError for empty string', () => {
      expect(() => assertEventType('')).toThrow(BadRequestError);
      expect(() => assertEventType('')).toThrow('Invalid audit event type');
    });

    it('should throw BadRequestError for whitespace-only string', () => {
      expect(() => assertEventType('   ')).toThrow(BadRequestError);
      expect(() => assertEventType('   ')).toThrow('Invalid audit event type');
    });

    it('should throw BadRequestError for null', () => {
      expect(() => assertEventType(null as any)).toThrow(BadRequestError);
    });

    it('should throw BadRequestError for undefined', () => {
      expect(() => assertEventType(undefined as any)).toThrow(BadRequestError);
    });

    it('should throw BadRequestError for non-string', () => {
      expect(() => assertEventType(123 as any)).toThrow(BadRequestError);
      expect(() => assertEventType({} as any)).toThrow(BadRequestError);
    });
  });

  describe('assertActorShape', () => {
    it('should pass for valid actor payload', () => {
      const payload = { userId: 'user-123', email: 'user@example.com' };
      expect(() => assertActorShape(payload)).not.toThrow();
    });

    it('should pass for null payload', () => {
      expect(() => assertActorShape(null)).not.toThrow();
    });

    it('should pass for undefined payload', () => {
      expect(() => assertActorShape(undefined)).not.toThrow();
    });

    it('should throw BadRequestError for non-object payload', () => {
      expect(() => assertActorShape('string')).toThrow(BadRequestError);
      expect(() => assertActorShape(123)).toThrow(BadRequestError);
      expect(() => assertActorShape([])).not.toThrow(); // Arrays are objects in JavaScript
    });
  });
});
