/**
 * @fileoverview EntityFactory Tests - Unit tests for EntityFactory
 * @summary Tests for entity and value object creation
 * @description Comprehensive test suite for EntityFactory covering
 * entity creation, value object creation, and error handling.
 */

import { describe, it, expect } from '@jest/globals';
import { EntityFactory } from '../../../../src/infrastructure/factories/EntityFactory';
import { Notification } from '../../../../src/domain/entities/Notification';
import { NotificationId } from '../../../../src/domain/value-objects/NotificationId';
import { NotificationChannel, NotificationStatus, RecipientType } from '@prisma/client';
import { invalidEntity } from '../../../../src/notification-errors';
import { BadRequestError } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../helpers/testUtils';

describe('EntityFactory', () => {
  describe('create', () => {
    it('creates Notification entity', () => {
      const data = {
        notificationId: 'notif-123',
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test',
        body: 'Test Body',
      };
      const result = EntityFactory.create<Notification>('Notification', data);
      expect(result).toBeInstanceOf(Notification);
      expect(result.getNotificationId()).toBe('notif-123');
      expect(result.getChannel()).toBe(NotificationChannel.EMAIL);
      expect(result.getStatus()).toBe(NotificationStatus.PENDING);
    });

    it('throws error for unknown entity type', () => {
      expect(() => EntityFactory.create('UnknownEntity', {})).toThrow(BadRequestError);
    });
  });

  describe('createNotification', () => {
    it('creates notification with provided data', () => {
      const data = {
        notificationId: 'notif-123',
        eventId: 'event-123',
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        subject: 'Test Subject',
        body: 'Test Body',
        maxRetries: 5,
      };
      const result = EntityFactory.createNotification(data);
      expect(result).toBeInstanceOf(Notification);
      expect(result.getNotificationId()).toBe('notif-123');
      expect(result.getEventId()).toBe('event-123');
      expect(result.getEventType()).toBe('ENVELOPE_INVITATION');
      expect(result.getChannel()).toBe(NotificationChannel.EMAIL);
      expect(result.getRecipient()).toBe('test@example.com');
      expect(result.getRecipientType()).toBe(RecipientType.EMAIL);
      expect(result.getSubject()).toBe('Test Subject');
      expect(result.getBody()).toBe('Test Body');
      expect(result.getMaxRetries()).toBe(5);
      expect(result.getRetryCount()).toBe(0);
      expect(result.getStatus()).toBe(NotificationStatus.PENDING);
    });

    it('generates notificationId when not provided', () => {
      const data = {
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
      };
      const result = EntityFactory.createNotification(data);
      expect(result.getNotificationId()).toBeDefined();
      expect(result.getNotificationId().length).toBeGreaterThan(0);
    });

    it('uses default maxRetries when not provided', () => {
      const data = {
        eventType: 'ENVELOPE_INVITATION',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
      };
      const result = EntityFactory.createNotification(data);
      expect(result.getMaxRetries()).toBe(3);
    });
  });

  describe('createValueObjects', () => {
    describe('notificationId', () => {
      it('creates NotificationId from string', () => {
        const uuid = TestUtils.generateUuid();
        const result = EntityFactory.createValueObjects.notificationId(uuid);
        expect(result).toBeInstanceOf(NotificationId);
        expect(result.getValue()).toBe(uuid);
      });

      it('generates new NotificationId when value not provided', () => {
        const result = EntityFactory.createValueObjects.notificationId();
        expect(result).toBeInstanceOf(NotificationId);
        expect(result.getValue()).toBeDefined();
      });
    });
  });
});

