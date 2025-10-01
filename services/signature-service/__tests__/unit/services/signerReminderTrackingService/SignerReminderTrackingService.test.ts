/**
 * @fileoverview SignerReminderTrackingService.test.ts - Unit tests for SignerReminderTrackingService
 * @summary Tests for SignerReminderTrackingService reminder tracking operations
 * @description Tests all SignerReminderTrackingService methods including reminder recording,
 * reminder validation, and tracking management with comprehensive coverage.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SignerReminderTrackingService } from '../../../../src/services/signerReminderTrackingService/SignerReminderTrackingService';
import { SignerReminderTrackingRepository } from '../../../../src/repositories/SignerReminderTrackingRepository';
import { SignerReminderTracking } from '../../../../src/domain/entities/SignerReminderTracking';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { TestUtils } from '../../../helpers/testUtils';

describe('SignerReminderTrackingService', () => {
  let signerReminderTrackingService: SignerReminderTrackingService;
  let mockRepository: jest.Mocked<SignerReminderTrackingRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock repository
    mockRepository = {
      create: jest.fn(),
      findBySignerAndEnvelope: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      findByEnvelope: jest.fn(),
      findBySigner: jest.fn(),
      countBySignerAndEnvelope: jest.fn(),
      findRecentReminders: jest.fn(),
      upsert: jest.fn()
    } as any;

    // Create service instance
    signerReminderTrackingService = new SignerReminderTrackingService(mockRepository);
  });

  describe('recordReminderSent', () => {
    it('should record reminder sent successfully for new tracking', async () => {
      const signerId = new SignerId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const message = 'Please sign the document';
      
      const trackingEntity = SignerReminderTracking.create({
        id: TestUtils.generateUuid(),
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        lastReminderAt: new Date(),
        reminderCount: 1,
        lastReminderMessage: message
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(null);
      mockRepository.upsert.mockResolvedValue(trackingEntity);

      const result = await signerReminderTrackingService.recordReminderSent(signerId, envelopeId, message);

      expect(mockRepository.findBySignerAndEnvelope).toHaveBeenCalledTimes(1);
      expect(mockRepository.upsert).toHaveBeenCalledTimes(1);
      expect(result).toBe(trackingEntity);
    });

    it('should update existing tracking when reminder already exists', async () => {
      const signerId = new SignerId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const message = 'Please sign the document';
      
      const existingTracking = SignerReminderTracking.create({
        id: TestUtils.generateUuid(),
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        lastReminderAt: new Date(Date.now() - 3600000), // 1 hour ago
        reminderCount: 1,
        lastReminderMessage: 'Previous message'
      });

      const updatedTracking = SignerReminderTracking.create({
        id: existingTracking.getId().getValue(),
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        lastReminderAt: new Date(),
        reminderCount: 2,
        lastReminderMessage: message
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(existingTracking);
      mockRepository.upsert.mockResolvedValue(updatedTracking);

      const result = await signerReminderTrackingService.recordReminderSent(signerId, envelopeId, message);

      expect(mockRepository.findBySignerAndEnvelope).toHaveBeenCalledTimes(1);
      expect(mockRepository.upsert).toHaveBeenCalledTimes(1);
      expect(result).toBe(updatedTracking);
    });

    it('should handle repository errors gracefully', async () => {
      const signerId = new SignerId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const message = 'Please sign the document';
      
      const error = new Error('Database connection failed');
      mockRepository.findBySignerAndEnvelope.mockRejectedValue(error);

      await expect(signerReminderTrackingService.recordReminderSent(signerId, envelopeId, message))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('canSendReminder', () => {
    it('should allow reminder when no previous reminders exist', async () => {
      const signerId = new SignerId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const maxReminders = 3;
      const minHoursBetween = 24;

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(null);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId,
        envelopeId,
        maxReminders,
        minHoursBetween
      );

      expect(mockRepository.findBySignerAndEnvelope).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        canSend: true,
        reason: undefined,
        tracking: undefined
      });
    });

    it('should allow reminder when under max limit and enough time has passed', async () => {
      const signerId = new SignerId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      const existingTracking = SignerReminderTracking.create({
        id: TestUtils.generateUuid(),
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        lastReminderAt: new Date(Date.now() - 25 * 3600000), // 25 hours ago
        reminderCount: 2,
        lastReminderMessage: 'Previous message'
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(existingTracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId,
        envelopeId,
        maxReminders,
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: true,
        reason: undefined,
        tracking: existingTracking
      });
    });

    it('should deny reminder when max limit reached', async () => {
      const signerId = new SignerId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      const existingTracking = SignerReminderTracking.create({
        id: TestUtils.generateUuid(),
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        lastReminderAt: new Date(Date.now() - 25 * 3600000), // 25 hours ago
        reminderCount: 3,
        lastReminderMessage: 'Previous message'
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(existingTracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId,
        envelopeId,
        maxReminders,
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: false,
        reason: 'Maximum reminders limit reached (3/3)',
        tracking: existingTracking
      });
    });

    it('should deny reminder when not enough time has passed', async () => {
      const signerId = new SignerId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      const existingTracking = SignerReminderTracking.create({
        id: TestUtils.generateUuid(),
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        lastReminderAt: new Date(Date.now() - 12 * 3600000), // 12 hours ago
        reminderCount: 1,
        lastReminderMessage: 'Previous message'
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(existingTracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId,
        envelopeId,
        maxReminders,
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: false,
        reason: 'Minimum 24 hours between reminders not met (12 hours remaining)',
        tracking: existingTracking
      });
    });

    it('should handle edge case when lastReminderSentAt is null', async () => {
      const signerId = new SignerId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      const existingTracking = SignerReminderTracking.create({
        id: TestUtils.generateUuid(),
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        lastReminderAt: null,
        reminderCount: 1,
        lastReminderMessage: 'Previous message'
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(existingTracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId,
        envelopeId,
        maxReminders,
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: true,
        reason: undefined,
        tracking: existingTracking
      });
    });

    it('should handle repository errors gracefully', async () => {
      const signerId = new SignerId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const maxReminders = 3;
      const minHoursBetween = 24;
      
      const error = new Error('Database connection failed');
      mockRepository.findBySignerAndEnvelope.mockRejectedValue(error);

      await expect(signerReminderTrackingService.canSendReminder(
        signerId,
        envelopeId,
        maxReminders,
        minHoursBetween
      )).rejects.toThrow('Database connection failed');
    });

    it('should handle zero maxReminders limit', async () => {
      const signerId = new SignerId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const maxReminders = 0;
      const minHoursBetween = 24;

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(null);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId,
        envelopeId,
        maxReminders,
        minHoursBetween
      );

      // When no tracking exists, it allows the first reminder regardless of maxReminders
      expect(result).toEqual({
        canSend: true,
        reason: undefined,
        tracking: undefined
      });
    });

    it('should handle zero minHoursBetween requirement', async () => {
      const signerId = new SignerId(TestUtils.generateUuid());
      const envelopeId = new EnvelopeId(TestUtils.generateUuid());
      const maxReminders = 3;
      const minHoursBetween = 0;
      
      const existingTracking = SignerReminderTracking.create({
        id: TestUtils.generateUuid(),
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        lastReminderAt: new Date(Date.now() - 1 * 3600000), // 1 hour ago
        reminderCount: 1,
        lastReminderMessage: 'Previous message'
      });

      mockRepository.findBySignerAndEnvelope.mockResolvedValue(existingTracking);

      const result = await signerReminderTrackingService.canSendReminder(
        signerId,
        envelopeId,
        maxReminders,
        minHoursBetween
      );

      expect(result).toEqual({
        canSend: true,
        reason: undefined,
        tracking: existingTracking
      });
    });
  });
});