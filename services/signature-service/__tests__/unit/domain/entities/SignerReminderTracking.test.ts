/**
 * @fileoverview SignerReminderTracking Entity Unit Tests
 * @summary Comprehensive test suite for SignerReminderTracking entity with 100% coverage
 * @description Tests all business logic, state transitions, validations, and edge cases
 * for the SignerReminderTracking entity that manages reminder tracking and limits.
 */

import { SignerReminderTracking, ReminderGateReason } from '../../../../src/domain/entities/SignerReminderTracking';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { ReminderTrackingId } from '../../../../src/domain/value-objects/ReminderTrackingId';
import { TestUtils } from '../../../helpers/testUtils';
import { trackingEntity, trackingEntityNew, trackingPersistenceRow } from '../../../helpers/builders/signerReminderTracking';
import { createFixedClock } from '@lawprotect/shared-ts';

describe('SignerReminderTracking', () => {
  describe('Constructor and Factory Methods', () => {
    it('creates entity with create method', () => {
      const id = TestUtils.generateReminderTrackingId();
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-01T00:00:00Z');

      const entity = SignerReminderTracking.create({
        id: id.getValue(),
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        lastReminderAt: null,
        reminderCount: 0,
        lastReminderMessage: null,
        createdAt,
        updatedAt
      });

      expect(entity.getId()).toEqual(id);
      expect(entity.getSignerId()).toEqual(signerId);
      expect(entity.getEnvelopeId()).toEqual(envelopeId);
      expect(entity.getLastReminderAt()).toBeNull();
      expect(entity.getReminderCount()).toBe(0);
      expect(entity.getLastReminderMessage()).toBeNull();
      expect(entity.getCreatedAt()).toEqual(createdAt);
      expect(entity.getUpdatedAt()).toEqual(updatedAt);
    });

    it('creates entity with createNew method', () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const fixedTime = new Date('2024-01-01T12:00:00Z');
      const clock = createFixedClock(fixedTime);

      const entity = SignerReminderTracking.createNew(signerId, envelopeId, clock);

      expect(entity.getSignerId()).toEqual(signerId);
      expect(entity.getEnvelopeId()).toEqual(envelopeId);
      expect(entity.getLastReminderAt()).toBeNull();
      expect(entity.getReminderCount()).toBe(0);
      expect(entity.getLastReminderMessage()).toBeNull();
      expect(entity.getCreatedAt()).toEqual(fixedTime);
      expect(entity.getUpdatedAt()).toEqual(fixedTime);
    });

    it('creates entity with fromPersistence method', () => {
      const row = trackingPersistenceRow({
        lastReminderAt: '2024-01-01T10:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      });

      const entity = SignerReminderTracking.fromPersistence(row);

      expect(entity.getId().getValue()).toBe(row.id);
      expect(entity.getSignerId().getValue()).toBe(row.signerId);
      expect(entity.getEnvelopeId().getValue()).toBe(row.envelopeId);
      expect(entity.getLastReminderAt()).toEqual(new Date(row.lastReminderAt));
      expect(entity.getReminderCount()).toBe(row.reminderCount);
      expect(entity.getLastReminderMessage()).toBe(row.lastReminderMessage);
      expect(entity.getCreatedAt()).toEqual(new Date(row.createdAt));
      expect(entity.getUpdatedAt()).toEqual(new Date(row.updatedAt));
    });

    it('handles null dates in fromPersistence', () => {
      const row = {
        id: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        envelopeId: TestUtils.generateUuid(),
        lastReminderAt: null,
        reminderCount: 0,
        lastReminderMessage: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const entity = SignerReminderTracking.fromPersistence(row);

      expect(entity.getLastReminderAt()).toBeNull();
    });
  });

  describe('recordReminderSent', () => {
    it('records reminder with message', () => {
      const entity = trackingEntity({ reminderCount: 2 });
      const fixedTime = new Date('2024-01-02T12:00:00Z');
      const clock = createFixedClock(fixedTime);
      const message = 'Please sign the document';

      const updated = entity.recordReminderSent(message, clock);

      expect(updated.getReminderCount()).toBe(3);
      expect(updated.getLastReminderAt()).toEqual(fixedTime);
      expect(updated.getLastReminderMessage()).toBe(message);
      expect(updated.getUpdatedAt()).toEqual(fixedTime);
      expect(updated.getId()).toEqual(entity.getId());
    });

    it('records reminder without message', () => {
      const entity = trackingEntity({ reminderCount: 1 });
      const fixedTime = new Date('2024-01-02T12:00:00Z');
      const clock = createFixedClock(fixedTime);

      const updated = entity.recordReminderSent(undefined, clock);

      expect(updated.getReminderCount()).toBe(2);
      expect(updated.getLastReminderAt()).toEqual(fixedTime);
      expect(updated.getLastReminderMessage()).toBeNull();
      expect(updated.getUpdatedAt()).toEqual(fixedTime);
    });

    it('truncates long messages', () => {
      const entity = trackingEntity();
      const longMessage = 'a'.repeat(1500);
      const clock = createFixedClock(new Date());

      const updated = entity.recordReminderSent(longMessage, clock);

      expect(updated.getLastReminderMessage()).toBe('a'.repeat(1024));
    });

    it('handles empty string message', () => {
      const entity = trackingEntity();
      const clock = createFixedClock(new Date());

      const updated = entity.recordReminderSent('   ', clock);

      expect(updated.getLastReminderMessage()).toBeNull();
    });

    it('handles whitespace-only message', () => {
      const entity = trackingEntity();
      const clock = createFixedClock(new Date());

      const updated = entity.recordReminderSent('\t\n  ', clock);

      expect(updated.getLastReminderMessage()).toBeNull();
    });

    it('uses systemClock when no clock provided', () => {
      const entity = trackingEntity();
      const before = new Date();
      
      const updated = entity.recordReminderSent('test');
      
      const after = new Date();
      expect(updated.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updated.getUpdatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('evaluateReminderGate', () => {
    it('allows reminder when count is below limit and no previous reminder', () => {
      const entity = trackingEntity({ reminderCount: 2 });
      const clock = createFixedClock(new Date());

      const gate = entity.evaluateReminderGate(5, 24, clock);

      expect(gate.ok).toBe(true);
    });

    it('blocks reminder when count reaches limit', () => {
      const entity = trackingEntity({ reminderCount: 5 });
      const clock = createFixedClock(new Date());

      const gate = entity.evaluateReminderGate(5, 24, clock);

      expect(gate.ok).toBe(false);
      if (!gate.ok) {
        expect(gate.reason).toBe(ReminderGateReason.LIMIT_REACHED);
      }
    });

    it('blocks reminder when minimum interval not met', () => {
      const lastReminder = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-01T20:00:00Z'); // 10 hours later
      const entity = trackingEntity({ 
        reminderCount: 2,
        lastReminderAt: lastReminder 
      });
      const clock = createFixedClock(currentTime);

      const gate = entity.evaluateReminderGate(5, 24, clock);

      expect(gate.ok).toBe(false);
      if (!gate.ok) {
        expect(gate.reason).toBe(ReminderGateReason.MIN_INTERVAL);
        expect(gate.remainingHours).toBe(14); // 24 - 10 = 14
      }
    });

    it('allows reminder when minimum interval is met', () => {
      const lastReminder = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-02T11:00:00Z'); // 25 hours later
      const entity = trackingEntity({ 
        reminderCount: 2,
        lastReminderAt: lastReminder 
      });
      const clock = createFixedClock(currentTime);

      const gate = entity.evaluateReminderGate(5, 24, clock);

      expect(gate.ok).toBe(true);
    });

    it('validates non-negative parameters', () => {
      const entity = trackingEntity();
      const clock = createFixedClock(new Date());

      expect(() => entity.evaluateReminderGate(-1, 24, clock)).toThrow('Invalid value for maxReminders: expected non-negative number, got -1');
      expect(() => entity.evaluateReminderGate(5, -1, clock)).toThrow('Invalid value for minHoursBetween: expected non-negative number, got -1');
    });

    it('handles zero limits correctly', () => {
      const entity = trackingEntity({ reminderCount: 0 });
      const clock = createFixedClock(new Date());

      const gate = entity.evaluateReminderGate(0, 0, clock);

      expect(gate.ok).toBe(false);
      if (!gate.ok) {
        expect(gate.reason).toBe(ReminderGateReason.LIMIT_REACHED);
      }
    });

    it('uses systemClock when no clock provided', () => {
      const entity = trackingEntity();

      const gate = entity.evaluateReminderGate(5, 24);

      expect(gate.ok).toBe(true);
    });
  });

  describe('canSendReminder (deprecated)', () => {
    it('returns true when reminder can be sent', () => {
      const entity = trackingEntity({ reminderCount: 2 });
      const clock = createFixedClock(new Date());

      const result = entity.canSendReminder(5, 24, clock);

      expect(result).toBe(true);
    });

    it('returns false when reminder cannot be sent', () => {
      const entity = trackingEntity({ reminderCount: 5 });
      const clock = createFixedClock(new Date());

      const result = entity.canSendReminder(5, 24, clock);

      expect(result).toBe(false);
    });
  });

  describe('getReminderBlockReason (deprecated)', () => {
    it('returns null when reminder can be sent', () => {
      const entity = trackingEntity({ reminderCount: 2 });
      const clock = createFixedClock(new Date());

      const reason = entity.getReminderBlockReason(5, 24, clock);

      expect(reason).toBeNull();
    });

    it('returns limit reached reason', () => {
      const entity = trackingEntity({ reminderCount: 5 });
      const clock = createFixedClock(new Date());

      const reason = entity.getReminderBlockReason(5, 24, clock);

      expect(reason).toContain('Maximum reminders limit reached');
      expect(reason).toContain('5/5');
    });

    it('returns minimum interval reason', () => {
      const lastReminder = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-01T20:00:00Z');
      const entity = trackingEntity({ 
        reminderCount: 2,
        lastReminderAt: lastReminder 
      });
      const clock = createFixedClock(currentTime);

      const reason = entity.getReminderBlockReason(5, 24, clock);

      expect(reason).toContain('Minimum 24 hours between reminders');
      expect(reason).toContain('14 hours remaining');
    });

    it('handles unknown reason in getReminderBlockReason', () => {
      const entity = trackingEntity({ reminderCount: 5 });
      const clock = createFixedClock(new Date());

      // Mock the evaluateReminderGate to return an unknown reason
      jest.spyOn(entity, 'evaluateReminderGate').mockReturnValue({
        ok: false,
        reason: 'UNKNOWN_REASON' as any,
        remainingHours: 0
      });

      const reason = entity.getReminderBlockReason(5, 24, clock);

      expect(reason).toBeNull();

      // Restore the original method
      jest.restoreAllMocks();
    });
  });

  describe('Getters', () => {
    it('returns correct ID', () => {
      const id = TestUtils.generateReminderTrackingId();
      const entity = trackingEntity({ id });

      expect(entity.getId()).toEqual(id);
    });

    it('returns correct signer ID', () => {
      const signerId = TestUtils.generateSignerId();
      const entity = trackingEntity({ signerId });

      expect(entity.getSignerId()).toEqual(signerId);
    });

    it('returns correct envelope ID', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const entity = trackingEntity({ envelopeId });

      expect(entity.getEnvelopeId()).toEqual(envelopeId);
    });

    it('returns correct last reminder time', () => {
      const lastReminder = new Date('2024-01-01T10:00:00Z');
      const entity = trackingEntity({ lastReminderAt: lastReminder });

      expect(entity.getLastReminderAt()).toEqual(lastReminder);
    });

    it('returns correct reminder count', () => {
      const entity = trackingEntity({ reminderCount: 3 });

      expect(entity.getReminderCount()).toBe(3);
    });

    it('returns correct last reminder message', () => {
      const message = 'Please sign the document';
      const entity = trackingEntity({ lastReminderMessage: message });

      expect(entity.getLastReminderMessage()).toBe(message);
    });

    it('returns correct created at time', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const entity = trackingEntity({ createdAt });

      expect(entity.getCreatedAt()).toEqual(createdAt);
    });

    it('returns correct updated at time', () => {
      const updatedAt = new Date('2024-01-01T12:00:00Z');
      const entity = trackingEntity({ updatedAt });

      expect(entity.getUpdatedAt()).toEqual(updatedAt);
    });
  });

  describe('toPersistence', () => {
    it('converts entity to persistence format', () => {
      const entity = trackingEntity({
        lastReminderAt: new Date('2024-01-01T10:00:00Z'),
        reminderCount: 3,
        lastReminderMessage: 'Please sign',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      });

      const persistence = entity.toPersistence();

      expect(persistence.id).toBe(entity.getId().getValue());
      expect(persistence.signerId).toBe(entity.getSignerId().getValue());
      expect(persistence.envelopeId).toBe(entity.getEnvelopeId().getValue());
      expect(persistence.lastReminderAt).toEqual(entity.getLastReminderAt());
      expect(persistence.reminderCount).toBe(entity.getReminderCount());
      expect(persistence.lastReminderMessage).toBe(entity.getLastReminderMessage());
      expect(persistence.createdAt).toEqual(entity.getCreatedAt());
      expect(persistence.updatedAt).toEqual(entity.getUpdatedAt());
    });

    it('handles null values correctly', () => {
      const entity = SignerReminderTracking.create({
        id: TestUtils.generateUuid(),
        signerId: TestUtils.generateUuid(),
        envelopeId: TestUtils.generateUuid(),
        lastReminderAt: null,
        reminderCount: 0,
        lastReminderMessage: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      });

      const persistence = entity.toPersistence();

      expect(persistence.lastReminderAt).toBeNull();
      expect(persistence.lastReminderMessage).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles very large reminder counts', () => {
      const entity = trackingEntity({ reminderCount: 999999 });
      const clock = createFixedClock(new Date());

      const gate = entity.evaluateReminderGate(1000000, 24, clock);

      expect(gate.ok).toBe(true);
    });

    it('handles very small time intervals', () => {
      const lastReminder = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-01T10:00:01Z'); // 1 second later
      const entity = trackingEntity({ 
        reminderCount: 2,
        lastReminderAt: lastReminder 
      });
      const clock = createFixedClock(currentTime);

      const gate = entity.evaluateReminderGate(5, 1, clock);

      expect(gate.ok).toBe(false);
      if (!gate.ok) {
        expect(gate.reason).toBe(ReminderGateReason.MIN_INTERVAL);
      }
    });

    it('handles exactly at limit scenarios', () => {
      const entity = trackingEntity({ reminderCount: 5 });
      const clock = createFixedClock(new Date());

      const gate = entity.evaluateReminderGate(5, 24, clock);

      expect(gate.ok).toBe(false);
      if (!gate.ok) {
        expect(gate.reason).toBe(ReminderGateReason.LIMIT_REACHED);
      }
    });

    it('handles exactly at interval scenarios', () => {
      const lastReminder = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-02T10:00:00Z'); // Exactly 24 hours later
      const entity = trackingEntity({ 
        reminderCount: 2,
        lastReminderAt: lastReminder 
      });
      const clock = createFixedClock(currentTime);

      const gate = entity.evaluateReminderGate(5, 24, clock);

      expect(gate.ok).toBe(true);
    });
  });

  describe('Immutability', () => {
    it('creates new instance when recording reminder', () => {
      const entity = trackingEntity({ reminderCount: 2 });
      const clock = createFixedClock(new Date());

      const updated = entity.recordReminderSent('test', clock);

      expect(updated).not.toBe(entity);
      expect(updated.getId()).toEqual(entity.getId());
      expect(updated.getReminderCount()).toBe(3);
      expect(entity.getReminderCount()).toBe(2); // Original unchanged
    });

    it('preserves all other fields when recording reminder', () => {
      const entity = trackingEntity({
        signerId: TestUtils.generateSignerId(),
        envelopeId: TestUtils.generateEnvelopeId(),
        createdAt: new Date('2024-01-01T00:00:00Z')
      });
      const clock = createFixedClock(new Date());

      const updated = entity.recordReminderSent('test', clock);

      expect(updated.getSignerId()).toEqual(entity.getSignerId());
      expect(updated.getEnvelopeId()).toEqual(entity.getEnvelopeId());
      expect(updated.getCreatedAt()).toEqual(entity.getCreatedAt());
    });
  });
});
