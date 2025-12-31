/**
 * @fileoverview UserAuditEvent.test.ts - Unit tests for UserAuditEvent entity
 * @summary Tests for UserAuditEvent entity behavior
 * @description Tests the UserAuditEvent entity including creation, persistence, and audit data handling.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { UserAuditEvent } from '../../../src/domain/entities/UserAuditEvent';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { UserAuditAction } from '../../../src/domain/enums/UserAuditAction';
import { TestUtils } from '../../helpers/testUtils';

describe('UserAuditEvent', () => {
  let userId: UserId;
  let createdAt: Date;

  beforeEach(() => {
    userId = UserId.fromString(TestUtils.generateUuid());
    createdAt = new Date('2024-01-01T00:00:00Z');
  });

  describe('constructor', () => {
    it('should create UserAuditEvent with all fields', () => {
      const event = new UserAuditEvent(
        'event-id-123',
        userId,
        UserAuditAction.USER_REGISTERED,
        'User registered successfully',
        'admin-id-456',
        '192.168.1.1',
        'Mozilla/5.0',
        { source: 'web', version: '1.0' },
        createdAt
      );

      expect(event.getId()).toBe('event-id-123');
      expect(event.getUserId()).toEqual(userId);
      expect(event.getAction()).toBe(UserAuditAction.USER_REGISTERED);
      expect(event.getDescription()).toBe('User registered successfully');
      expect(event.getActorId()).toBe('admin-id-456');
      expect(event.getIpAddress()).toBe('192.168.1.1');
      expect(event.getUserAgent()).toBe('Mozilla/5.0');
      expect(event.getMetadata()).toEqual({ source: 'web', version: '1.0' });
      expect(event.getCreatedAt()).toEqual(createdAt);
    });

    it('should create UserAuditEvent with minimal fields', () => {
      const event = new UserAuditEvent(
        'event-id-123',
        userId,
        UserAuditAction.USER_LOGIN,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        createdAt
      );

      expect(event.getAction()).toBe(UserAuditAction.USER_LOGIN);
      expect(event.getDescription()).toBeUndefined();
      expect(event.getActorId()).toBeUndefined();
      expect(event.getIpAddress()).toBeUndefined();
      expect(event.getUserAgent()).toBeUndefined();
      expect(event.getMetadata()).toBeUndefined();
    });
  });

  describe('fromPersistence', () => {
    it('should create UserAuditEvent from persistence data', () => {
      const persistenceData = {
        id: 'event-id-123',
        userId: userId.toString(),
        action: UserAuditAction.PROFILE_UPDATED,
        description: 'Profile updated',
        actorId: 'user-id-789',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120.0',
        metadata: { field: 'email', oldValue: 'old@example.com', newValue: 'new@example.com' },
        createdAt
      };

      const event = UserAuditEvent.fromPersistence(persistenceData);

      expect(event.getId()).toBe('event-id-123');
      expect(event.getUserId().toString()).toBe(userId.toString());
      expect(event.getAction()).toBe(UserAuditAction.PROFILE_UPDATED);
      expect(event.getDescription()).toBe('Profile updated');
      expect(event.getActorId()).toBe('user-id-789');
      expect(event.getIpAddress()).toBe('10.0.0.1');
      expect(event.getUserAgent()).toBe('Chrome/120.0');
      expect(event.getMetadata()).toEqual({ field: 'email', oldValue: 'old@example.com', newValue: 'new@example.com' });
    });

    it('should handle null values from persistence', () => {
      const persistenceData = {
        id: 'event-id-123',
        userId: userId.toString(),
        action: UserAuditAction.USER_LOGIN,
        description: null,
        actorId: null,
        ipAddress: null,
        userAgent: null,
        metadata: null,
        createdAt
      };

      const event = UserAuditEvent.fromPersistence(persistenceData);

      expect(event.getDescription()).toBeUndefined();
      expect(event.getActorId()).toBeUndefined();
      expect(event.getIpAddress()).toBeUndefined();
      expect(event.getUserAgent()).toBeUndefined();
      expect(event.getMetadata()).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create new UserAuditEvent with generate id', () => {
      const event = UserAuditEvent.create({
        userId: userId.toString(),
        action: UserAuditAction.MFA_ENABLED,
        description: 'MFA enabled by user',
        actorId: userId.toString(),
        ipAddress: TestUtils.createTestIpAddress(),
        userAgent: TestUtils.createTestUserAgent(),
        metadata: { method: 'TOTP' }
      });

      expect(event.getId()).toBeDefined();
      expect(event.getUserId().toString()).toBe(userId.toString());
      expect(event.getAction()).toBe(UserAuditAction.MFA_ENABLED);
      expect(event.getDescription()).toBe('MFA enabled by user');
      expect(event.getActorId()).toBe(userId.toString());
      expect(event.getMetadata()).toEqual({ method: 'TOTP' });
      expect(event.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should create event with minimal params', () => {
      const event = UserAuditEvent.create({
        userId: userId.toString(),
        action: UserAuditAction.USER_LOGOUT
      });

      expect(event.getAction()).toBe(UserAuditAction.USER_LOGOUT);
      expect(event.getDescription()).toBeUndefined();
      expect(event.getActorId()).toBeUndefined();
      expect(event.getIpAddress()).toBeUndefined();
      expect(event.getUserAgent()).toBeUndefined();
      expect(event.getMetadata()).toBeUndefined();
    });

    it('should generate unique IDs for multiple events', () => {
      const event1 = UserAuditEvent.create({
        userId: userId.toString(),
        action: UserAuditAction.USER_LOGIN
      });

      const event2 = UserAuditEvent.create({
        userId: userId.toString(),
        action: UserAuditAction.USER_LOGIN
      });

      expect(event1.getId()).not.toBe(event2.getId());
    });
  });

  describe('getters', () => {
    let event: UserAuditEvent;

    beforeEach(() => {
      event = new UserAuditEvent(
        'event-id-123',
        userId,
        UserAuditAction.ROLE_ASSIGNED,
        'Role assigned by admin',
        'admin-id-456',
        '192.168.1.100',
        'Firefox/121.0',
        { role: 'LAWYER', reason: 'Promotion' },
        createdAt
      );
    });

    it('should return correct id', () => {
      expect(event.getId()).toBe('event-id-123');
    });

    it('should return correct userId', () => {
      expect(event.getUserId()).toEqual(userId);
    });

    it('should return correct action', () => {
      expect(event.getAction()).toBe(UserAuditAction.ROLE_ASSIGNED);
    });

    it('should return correct description', () => {
      expect(event.getDescription()).toBe('Role assigned by admin');
    });

    it('should return correct actorId', () => {
      expect(event.getActorId()).toBe('admin-id-456');
    });

    it('should return correct ipAddress', () => {
      expect(event.getIpAddress()).toBe('192.168.1.100');
    });

    it('should return correct userAgent', () => {
      expect(event.getUserAgent()).toBe('Firefox/121.0');
    });

    it('should return correct metadata', () => {
      expect(event.getMetadata()).toEqual({ role: 'LAWYER', reason: 'Promotion' });
    });

    it('should return correct createdAt', () => {
      expect(event.getCreatedAt()).toEqual(createdAt);
    });
  });

  describe('different audit actions', () => {
    it('should create USER_REGISTERED event', () => {
      const event = new UserAuditEvent(
        'event-id-123',
        userId,
        UserAuditAction.USER_REGISTERED,
        'New user registration',
        undefined,
        undefined,
        undefined,
        undefined,
        createdAt
      );

      expect(event.getAction()).toBe(UserAuditAction.USER_REGISTERED);
    });

    it('should create MFA_DISABLED event', () => {
      const event = new UserAuditEvent(
        'event-id-123',
        userId,
        UserAuditAction.MFA_DISABLED,
        'MFA disabled by user request',
        userId.toString(),
        TestUtils.createTestIpAddress(),
        TestUtils.createTestUserAgent(),
        undefined,
        createdAt
      );

      expect(event.getAction()).toBe(UserAuditAction.MFA_DISABLED);
    });

    it('should create OAUTH_ACCOUNT_LINKED event', () => {
      const event = new UserAuditEvent(
        'event-id-123',
        userId,
        UserAuditAction.OAUTH_ACCOUNT_LINKED,
        'Google account linked',
        userId.toString(),
        TestUtils.createTestIpAddress(),
        TestUtils.createTestUserAgent(),
        { provider: 'GOOGLE' },
        createdAt
      );

      expect(event.getAction()).toBe(UserAuditAction.OAUTH_ACCOUNT_LINKED);
      expect(event.getMetadata()).toEqual({ provider: 'GOOGLE' });
    });

    it('should create SUSPICIOUS_ACTIVITY event', () => {
      const event = new UserAuditEvent(
        'event-id-123',
        userId,
        UserAuditAction.SUSPICIOUS_ACTIVITY,
        'Multiple failed login attempts detected',
        undefined,
        '192.168.1.200',
        'Unknown',
        { attempts: 5, timeWindow: '5 minutes' },
        createdAt
      );

      expect(event.getAction()).toBe(UserAuditAction.SUSPICIOUS_ACTIVITY);
      expect(event.getMetadata()).toEqual({ attempts: 5, timeWindow: '5 minutes' });
    });
  });
});









