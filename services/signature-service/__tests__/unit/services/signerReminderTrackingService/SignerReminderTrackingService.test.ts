/**
 * @fileoverview SignerReminderTrackingService.test.ts - Unit tests for SignerReminderTrackingService
 * @summary Tests for SignerReminderTrackingService reminder tracking operations
 * @description Tests all SignerReminderTrackingService methods including reminder recording,
 * eligibility checking, and business rule enforcement with comprehensive coverage.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SignerReminderTrackingService } from '../../../../src/services/signerReminderTrackingService/SignerReminderTrackingService';
import { SignerReminderTrackingRepository } from '../../../../src/repositories/SignerReminderTrackingRepository';
import { SignerReminderTracking } from '../../../../src/domain/entities/SignerReminderTracking';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { TestUtils } from '../../../helpers/testUtils';
import { 
  trackingEntity,
  trackingEntityNew,
  trackingPersistenceRow
} from '../../../helpers/builders/signerReminderTracking';
import { createSignerReminderTrackingServiceMock } from '../../../helpers/mocks/services/SignerReminderTrackingService.mock';
import { reminderTrackingNotFound, reminderTrackingCreationFailed } from '../../../../src/signature-errors/factories';

describe('SignerReminderTrackingService', () => {
  let signerReminderTrackingService: SignerReminderTrackingService;
  let mockRepository: jest.Mocked<SignerReminderTrackingRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock repository
    mockRepository = {
      findBySignerAndEnvelope: jest.fn(),
      upsert: jest.fn(),
      findById: jest.fn(),
      findByEnvelope: jest.fn(),
      findBySigner: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn()
    } as any;

    // Create service instance
    signerReminderTrackingService = new SignerReminderTrackingService(mockRepository);
  });

  describe('recordReminderSent', () => {
    it('should create new tracking when none exists', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const message = 'Test reminder message';
      
      const newTracking = trackingEntityNew({ signerId, envelopeId });
      const updatedTracking = trackingEntity({ 
        signerId, 
        envelopeId,
        reminderCount: 1,
        lastReminderMessage: message
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(null);
      mockRepository.upsert.mockResolvedValue(updatedTracking);

      const result = await signerReminderTrackingService.recordReminderSent(signerId, envelopeId, message);

      expect(mockRepository.findBySignerAndEnvelope).toHaveBeenCalledWith(signerId, envelopeId);
      expect(mockRepository.upsert).toHaveBeenCalledWith(expect.any(SignerReminderTracking));
      expect(result).toBe(updatedTracking);
    });

    it('should update existing tracking', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const message = 'Test reminder message';
      
      const existingTracking = trackingEntity({ 
        signerId, 
        envelopeId,
        reminderCount: 1,
        lastReminderMessage: 'Previous message'
      });
      const updatedTracking = trackingEntity({ 
        signerId, 
        envelopeId,
        reminderCount: 2,
        lastReminderMessage: message
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(existingTracking);
      mockRepository.upsert.mockResolvedValue(updatedTracking);

      const result = await signerReminderTrackingService.recordReminderSent(signerId, envelopeId, message);

      expect(mockRepository.findBySignerAndEnvelope).toHaveBeenCalledWith(signerId, envelopeId);
      expect(mockRepository.upsert).toHaveBeenCalledWith(expect.any(SignerReminderTracking));
      expect(result).toBe(updatedTracking);
    });

    it('should record reminder without message', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      
      const newTracking = trackingEntityNew({ signerId, envelopeId });
      const updatedTracking = trackingEntity({ 
        signerId, 
        envelopeId,
        reminderCount: 1,
        lastReminderMessage: null
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(null);
      mockRepository.upsert.mockResolvedValue(updatedTracking);

      const result = await signerReminderTrackingService.recordReminderSent(signerId, envelopeId);

      expect(mockRepository.findBySignerAndEnvelope).toHaveBeenCalledWith(signerId, envelopeId);
      expect(mockRepository.upsert).toHaveBeenCalledWith(expect.any(SignerReminderTracking));
      expect(result).toBe(updatedTracking);
    });

    it('should handle repository errors', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const message = 'Test reminder message';
      const error = new Error('Database error');

      mockRepository.findBySignerAndEnvelope.mockRejectedValue(error);

      await expect(
        signerReminderTrackingService.recordReminderSent(signerId, envelopeId, message)
      ).rejects.toThrow();
    });

    it('should handle upsert errors', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const message = 'Test reminder message';
      const error = new Error('Upsert failed');

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(null);
      mockRepository.upsert.mockRejectedValue(error);

      await expect(
        signerReminderTrackingService.recordReminderSent(signerId, envelopeId, message)
      ).rejects.toThrow();
    });
  });

  describe('canSendReminder', () => {
    it('should return canSend true when no tracking exists', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 24;

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(null);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(mockRepository.findBySignerAndEnvelope).toHaveBeenCalledWith(signerId, envelopeId);
      expect(result).toEqual({
        canSend: true,
        reason: undefined,
        tracking: undefined
      });
    });

    it('should return canSend true when tracking allows reminder', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 1,
        lastReminderAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: true,
        reason: undefined,
        tracking
      });
    });

    it('should return canSend false when max reminders reached', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 2;
      const minHoursBetween = 24;
      
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 2, // At max
        lastReminderAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: false,
        reason: expect.stringContaining('Maximum reminders limit reached'),
        tracking
      });
    });

    it('should return canSend false when time restriction not met', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 1,
        lastReminderAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: false,
        reason: expect.stringContaining('Minimum'),
        tracking
      });
    });

    it('should handle edge case with zero max reminders', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 0;
      const minHoursBetween = 24;
      
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 0
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: false,
        reason: expect.stringContaining('Maximum reminders limit reached'),
        tracking
      });
    });

    it('should handle edge case with zero min hours', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 0;
      
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 1,
        lastReminderAt: new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: true,
        reason: undefined,
        tracking
      });
    });

    it('should handle repository errors', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 24;
      const error = new Error('Database error');

      mockRepository.findBySignerAndEnvelope.mockRejectedValue(error);

      await expect(
        signerReminderTrackingService.canSendReminder(signerId, envelopeId, maxReminders, minHoursBetween)
      ).rejects.toThrow();
    });

    it('should handle tracking with null lastReminderAt', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 1,
        lastReminderAt: null
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: true,
        reason: undefined,
        tracking
      });
    });

    it('should handle tracking with undefined lastReminderAt', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 1,
        lastReminderAt: undefined
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: true,
        reason: undefined,
        tracking
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null signerId', async () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 24;

      // Mock repository to return null (no tracking exists)
      mockRepository.findBySignerAndEnvelope.mockResolvedValue(null);

      const result = await signerReminderTrackingService.canSendReminder(null as any, envelopeId, maxReminders, minHoursBetween);
      
      // Should still work but return canSend true
      expect(result.canSend).toBe(true);
    });

    it('should handle null envelopeId', async () => {
      const signerId = TestUtils.generateSignerId();
      const maxReminders = 3;
      const minHoursBetween = 24;

      // Mock repository to return null (no tracking exists)
      mockRepository.findBySignerAndEnvelope.mockResolvedValue(null);

      const result = await signerReminderTrackingService.canSendReminder(signerId, null as any, maxReminders, minHoursBetween);
      
      // Should still work but return canSend true
      expect(result.canSend).toBe(true);
    });

    it('should handle negative maxReminders', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = -1;
      const minHoursBetween = 24;
      
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 0
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      await expect(
        signerReminderTrackingService.canSendReminder(signerId, envelopeId, maxReminders, minHoursBetween)
      ).rejects.toThrow();
    });

    it('should handle negative minHoursBetween', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = -1;
      
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 1,
        lastReminderAt: new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      await expect(
        signerReminderTrackingService.canSendReminder(signerId, envelopeId, maxReminders, minHoursBetween)
      ).rejects.toThrow();
    });

    it('should handle very large numbers', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = Number.MAX_SAFE_INTEGER;
      const minHoursBetween = Number.MAX_SAFE_INTEGER;
      
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 1,
        lastReminderAt: new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result.canSend).toBe(false); // Should block due to time restriction
    });
  });

  describe('business logic validation', () => {
    it('should correctly calculate time differences', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      // Test with exactly 24 hours ago
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 1,
        lastReminderAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result.canSend).toBe(true);
    });

    it('should correctly handle boundary conditions', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      // Test with exactly 24 hours and 1 minute ago
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 1,
        lastReminderAt: new Date(Date.now() - (24 * 60 + 1) * 60 * 1000)
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result.canSend).toBe(true);
    });

    it('should handle tracking with very old lastReminderAt', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      // Test with 1 year ago
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 1,
        lastReminderAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result.canSend).toBe(true);
    });

    it('should handle tracking with future lastReminderAt', async () => {
      const signerId = TestUtils.generateSignerId();
      const envelopeId = TestUtils.generateEnvelopeId();
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      // Test with 1 hour in the future
      const tracking = trackingEntity({
        signerId,
        envelopeId,
        reminderCount: 1,
        lastReminderAt: new Date(Date.now() + 60 * 60 * 1000)
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(tracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId, 
        envelopeId, 
        maxReminders, 
        minHoursBetween
      );

      expect(result.canSend).toBe(false);
      expect(result.reason).toContain('Minimum');
    });
  });
});
