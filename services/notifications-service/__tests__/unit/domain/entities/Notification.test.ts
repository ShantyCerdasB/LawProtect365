/**
 * @fileoverview Notification Entity Unit Tests
 * @summary Comprehensive test suite for Notification entity with full coverage
 * @description Tests all business logic, state transitions, validations, and edge cases
 * for the Notification entity that manages notification lifecycle and status tracking.
 */

import { Notification } from '../../../../src/domain/entities/Notification';
import { NotificationId } from '../../../../src/domain/value-objects/NotificationId';
import { NotificationChannel, NotificationStatus, RecipientType } from '@prisma/client';
import { UnprocessableEntityError } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../helpers/testUtils';
import { notificationEntity, notificationPersistenceRow } from '../../../helpers/builders/notification';

describe('Notification', () => {
  describe('Constructor and Getters', () => {
    it('should create Notification with all required fields', () => {
      const entity = notificationEntity();

      expect(entity.getId()).toBeInstanceOf(NotificationId);
      expect(entity.getNotificationId()).toBeDefined();
      expect(entity.getChannel()).toBe(NotificationChannel.EMAIL);
      expect(entity.getRecipient()).toBe('test@example.com');
      expect(entity.getStatus()).toBe(NotificationStatus.PENDING);
      expect(entity.getRetryCount()).toBe(0);
      expect(entity.getMaxRetries()).toBe(3);
    });

    it('should return all getter values correctly', () => {
      const id = NotificationId.generate();
      const notificationId = TestUtils.generateUuid();
      const eventId = TestUtils.generateUuid();
      const now = new Date('2024-01-01T00:00:00Z');

      const entity = new Notification(
        id,
        notificationId,
        eventId,
        'ENVELOPE_INVITATION',
        NotificationChannel.EMAIL,
        'test@example.com',
        RecipientType.EMAIL,
        NotificationStatus.PENDING,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        0,
        3,
        'Subject',
        'Body',
        'template-123',
        { key: 'value' },
        'provider-msg-123',
        { response: 'data' },
        'user-123',
        'envelope-123',
        'signer-123',
        now,
        now
      );

      expect(entity.getId()).toBe(id);
      expect(entity.getNotificationId()).toBe(notificationId);
      expect(entity.getEventId()).toBe(eventId);
      expect(entity.getEventType()).toBe('ENVELOPE_INVITATION');
      expect(entity.getChannel()).toBe(NotificationChannel.EMAIL);
      expect(entity.getRecipient()).toBe('test@example.com');
      expect(entity.getRecipientType()).toBe(RecipientType.EMAIL);
      expect(entity.getStatus()).toBe(NotificationStatus.PENDING);
      expect(entity.getSubject()).toBe('Subject');
      expect(entity.getBody()).toBe('Body');
      expect(entity.getTemplateId()).toBe('template-123');
      expect(entity.getMetadata()).toEqual({ key: 'value' });
      expect(entity.getProviderMessageId()).toBe('provider-msg-123');
      expect(entity.getProviderResponse()).toEqual({ response: 'data' });
      expect(entity.getUserId()).toBe('user-123');
      expect(entity.getEnvelopeId()).toBe('envelope-123');
      expect(entity.getSignerId()).toBe('signer-123');
      expect(entity.getCreatedAt()).toEqual(now);
      expect(entity.getUpdatedAt()).toEqual(now);
    });

    it('should handle undefined optional fields', () => {
      const entity = notificationEntity({
        eventId: undefined,
        sentAt: undefined,
        subject: undefined,
        body: undefined
      });

      expect(entity.getEventId()).toBeUndefined();
      expect(entity.getSentAt()).toBeUndefined();
      expect(entity.getSubject()).toBeUndefined();
      expect(entity.getBody()).toBeUndefined();
    });
  });

  describe('markAsSent', () => {
    it('should mark notification as sent from PENDING status', () => {
      const entity = notificationEntity({ status: NotificationStatus.PENDING });
      const sentAt = new Date('2024-01-02T00:00:00Z');

      const updated = entity.markAsSent(sentAt);

      expect(updated.getStatus()).toBe(NotificationStatus.SENT);
      expect(updated.getSentAt()).toEqual(sentAt);
      expect(updated.getRetryCount()).toBe(entity.getRetryCount());
    });

    it('should use current time when timestamp is not provided', () => {
      const entity = notificationEntity({ status: NotificationStatus.PENDING });
      const before = new Date();

      const updated = entity.markAsSent();

      expect(updated.getStatus()).toBe(NotificationStatus.SENT);
      expect(updated.getSentAt()).toBeInstanceOf(Date);
      expect(updated.getSentAt()!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should throw error when trying to mark non-PENDING notification as sent', () => {
      const entity = notificationEntity({ status: NotificationStatus.SENT });

      expect(() => entity.markAsSent())
        .toThrow(UnprocessableEntityError);
    });

    it('should throw error when trying to mark FAILED notification as sent', () => {
      const entity = notificationEntity({ status: NotificationStatus.FAILED });

      expect(() => entity.markAsSent())
        .toThrow(UnprocessableEntityError);
    });
  });

  describe('markAsDelivered', () => {
    it('should mark notification as delivered from SENT status', () => {
      const sentAt = new Date('2024-01-02T00:00:00Z');
      const entity = notificationEntity({
        status: NotificationStatus.SENT,
        sentAt
      });
      const deliveredAt = new Date('2024-01-03T00:00:00Z');

      const updated = entity.markAsDelivered(deliveredAt);

      expect(updated.getStatus()).toBe(NotificationStatus.DELIVERED);
      expect(updated.getDeliveredAt()).toEqual(deliveredAt);
      expect(updated.getSentAt()).toEqual(sentAt);
    });

    it('should use current time when timestamp is not provided', () => {
      const entity = notificationEntity({ status: NotificationStatus.SENT });
      const before = new Date();

      const updated = entity.markAsDelivered();

      expect(updated.getStatus()).toBe(NotificationStatus.DELIVERED);
      expect(updated.getDeliveredAt()).toBeInstanceOf(Date);
      expect(updated.getDeliveredAt()!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should throw error when trying to mark non-SENT notification as delivered', () => {
      const entity = notificationEntity({ status: NotificationStatus.PENDING });

      expect(() => entity.markAsDelivered())
        .toThrow(UnprocessableEntityError);
    });

    it('should throw error when trying to mark FAILED notification as delivered', () => {
      const entity = notificationEntity({ status: NotificationStatus.FAILED });

      expect(() => entity.markAsDelivered())
        .toThrow(UnprocessableEntityError);
    });
  });

  describe('markAsFailed', () => {
    it('should mark notification as failed from PENDING status', () => {
      const entity = notificationEntity({ status: NotificationStatus.PENDING });
      const failedAt = new Date('2024-01-02T00:00:00Z');
      const errorMessage = 'Sending failed';
      const errorCode = 'SES_ERROR';

      const updated = entity.markAsFailed(errorMessage, errorCode, failedAt);

      expect(updated.getStatus()).toBe(NotificationStatus.FAILED);
      expect(updated.getFailedAt()).toEqual(failedAt);
      expect(updated.getErrorMessage()).toBe(errorMessage);
      expect(updated.getErrorCode()).toBe(errorCode);
      expect(updated.getRetryCount()).toBe(1);
    });

    it('should increment retry count when marking as failed', () => {
      const entity = notificationEntity({
        status: NotificationStatus.PENDING,
        retryCount: 2
      });

      const updated = entity.markAsFailed('Error');

      expect(updated.getRetryCount()).toBe(3);
    });

    it('should use current time when timestamp is not provided', () => {
      const entity = notificationEntity({ status: NotificationStatus.PENDING });
      const before = new Date();

      const updated = entity.markAsFailed('Error');

      expect(updated.getFailedAt()).toBeInstanceOf(Date);
      expect(updated.getFailedAt()!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should allow errorCode to be undefined', () => {
      const entity = notificationEntity({ status: NotificationStatus.PENDING });

      const updated = entity.markAsFailed('Error');

      expect(updated.getErrorMessage()).toBe('Error');
      expect(updated.getErrorCode()).toBeUndefined();
    });

    it('should throw error when trying to mark DELIVERED notification as failed', () => {
      const entity = notificationEntity({ status: NotificationStatus.DELIVERED });

      expect(() => entity.markAsFailed('Error'))
        .toThrow(UnprocessableEntityError);
    });
  });

  describe('markAsBounced', () => {
    it('should mark notification as bounced', () => {
      const entity = notificationEntity({ status: NotificationStatus.SENT });
      const bouncedAt = new Date('2024-01-02T00:00:00Z');

      const updated = entity.markAsBounced(bouncedAt);

      expect(updated.getStatus()).toBe(NotificationStatus.BOUNCED);
      expect(updated.getBouncedAt()).toEqual(bouncedAt);
    });

    it('should use current time when timestamp is not provided', () => {
      const entity = notificationEntity({ status: NotificationStatus.SENT });
      const before = new Date();

      const updated = entity.markAsBounced();

      expect(updated.getStatus()).toBe(NotificationStatus.BOUNCED);
      expect(updated.getBouncedAt()).toBeInstanceOf(Date);
      expect(updated.getBouncedAt()!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('updateProviderInfo', () => {
    it('should update provider message ID', () => {
      const entity = notificationEntity();
      const providerMessageId = 'new-provider-msg-123';

      const updated = entity.updateProviderInfo(providerMessageId);

      expect(updated.getProviderMessageId()).toBe(providerMessageId);
      expect(updated.getStatus()).toBe(entity.getStatus());
      expect(updated.getId()).toEqual(entity.getId());
    });

    it('should update provider message ID and response', () => {
      const entity = notificationEntity();
      const providerMessageId = 'new-provider-msg-123';
      const providerResponse = { messageId: '123', status: 'sent' };

      const updated = entity.updateProviderInfo(providerMessageId, providerResponse);

      expect(updated.getProviderMessageId()).toBe(providerMessageId);
      expect(updated.getProviderResponse()).toEqual(providerResponse);
    });

    it('should update updatedAt timestamp', () => {
      const entity = notificationEntity();
      const before = new Date();

      const updated = entity.updateProviderInfo('msg-123');

      expect(updated.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('canRetry', () => {
    it('should return true for FAILED notification with retry count below max', () => {
      const entity = notificationEntity({
        status: NotificationStatus.FAILED,
        retryCount: 1,
        maxRetries: 3
      });

      expect(entity.canRetry()).toBe(true);
    });

    it('should return false for FAILED notification with retry count at max', () => {
      const entity = notificationEntity({
        status: NotificationStatus.FAILED,
        retryCount: 3,
        maxRetries: 3
      });

      expect(entity.canRetry()).toBe(false);
    });

    it('should return false for PENDING notification', () => {
      const entity = notificationEntity({ status: NotificationStatus.PENDING });

      expect(entity.canRetry()).toBe(false);
    });

    it('should return false for SENT notification', () => {
      const entity = notificationEntity({ status: NotificationStatus.SENT });

      expect(entity.canRetry()).toBe(false);
    });
  });

  describe('fromPersistence', () => {
    it('should create Notification from persistence data', () => {
      const row = notificationPersistenceRow();

      const entity = Notification.fromPersistence(row);

      expect(entity).toBeInstanceOf(Notification);
      expect(entity.getId().getValue()).toBe(row.id);
      expect(entity.getNotificationId()).toBe(row.notificationId);
      expect(entity.getEventId()).toBe(row.eventId);
      expect(entity.getStatus()).toBe(row.status);
    });

    it('should handle null optional fields in persistence data', () => {
      const row = notificationPersistenceRow({
        eventId: null,
        sentAt: null,
        subject: null,
        body: null,
        metadata: null
      });

      const entity = Notification.fromPersistence(row);

      expect(entity.getEventId()).toBeUndefined();
      expect(entity.getSentAt()).toBeUndefined();
      expect(entity.getSubject()).toBeUndefined();
      expect(entity.getBody()).toBeUndefined();
      expect(entity.getMetadata()).toBeUndefined();
    });

    it('should convert date strings to Date objects', () => {
      const row = notificationPersistenceRow({
        sentAt: '2024-01-02T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      });

      const entity = Notification.fromPersistence(row);

      expect(entity.getSentAt()).toBeInstanceOf(Date);
      expect(entity.getCreatedAt()).toBeInstanceOf(Date);
      expect(entity.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should handle metadata and providerResponse as objects', () => {
      const row = notificationPersistenceRow({
        metadata: { key: 'value' },
        providerResponse: { status: 'sent' }
      });

      const entity = Notification.fromPersistence(row);

      expect(entity.getMetadata()).toEqual({ key: 'value' });
      expect(entity.getProviderResponse()).toEqual({ status: 'sent' });
    });
  });
});

