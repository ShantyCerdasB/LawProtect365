/**
 * @fileoverview UserPersonalInfo.test.ts - Unit tests for UserPersonalInfo entity
 * @summary Tests for UserPersonalInfo entity behavior
 * @description Tests the UserPersonalInfo entity including creation, updates, and data persistence.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { UserPersonalInfo } from '../../../src/domain/entities/UserPersonalInfo';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { TestUtils } from '../../helpers/testUtils';

describe('UserPersonalInfo', () => {
  let userId: UserId;
  let createdAt: Date;
  let updatedAt: Date;

  beforeEach(() => {
    userId = UserId.fromString(TestUtils.generateUuid());
    createdAt = new Date('2024-01-01T00:00:00Z');
    updatedAt = new Date('2024-01-01T00:00:00Z');
  });

  describe('constructor', () => {
    it('should create UserPersonalInfo with all fields', () => {
      const personalInfo = new UserPersonalInfo(
        'info-id-123',
        userId,
        '+1234567890',
        'en-US',
        'America/New_York',
        createdAt,
        updatedAt
      );

      expect(personalInfo.getId()).toBe('info-id-123');
      expect(personalInfo.getUserId()).toEqual(userId);
      expect(personalInfo.getPhone()).toBe('+1234567890');
      expect(personalInfo.getLocale()).toBe('en-US');
      expect(personalInfo.getTimeZone()).toBe('America/New_York');
      expect(personalInfo.getCreatedAt()).toEqual(createdAt);
      expect(personalInfo.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should create UserPersonalInfo with null values', () => {
      const personalInfo = new UserPersonalInfo(
        'info-id-123',
        userId,
        null,
        null,
        null,
        createdAt,
        updatedAt
      );

      expect(personalInfo.getPhone()).toBeNull();
      expect(personalInfo.getLocale()).toBeNull();
      expect(personalInfo.getTimeZone()).toBeNull();
    });
  });

  describe('fromPersistence', () => {
    it('should create UserPersonalInfo from persistence data', () => {
      const persistenceData = {
        id: 'info-id-123',
        userId: userId.toString(),
        phone: '+1234567890',
        locale: 'es-ES',
        timeZone: 'Europe/Madrid',
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      };

      const personalInfo = UserPersonalInfo.fromPersistence(persistenceData);

      expect(personalInfo.getId()).toBe('info-id-123');
      expect(personalInfo.getUserId().toString()).toBe(userId.toString());
      expect(personalInfo.getPhone()).toBe('+1234567890');
      expect(personalInfo.getLocale()).toBe('es-ES');
      expect(personalInfo.getTimeZone()).toBe('Europe/Madrid');
    });

    it('should handle null values from persistence', () => {
      const persistenceData = {
        id: 'info-id-123',
        userId: userId.toString(),
        phone: null,
        locale: null,
        timeZone: null,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      };

      const personalInfo = UserPersonalInfo.fromPersistence(persistenceData);

      expect(personalInfo.getPhone()).toBeNull();
      expect(personalInfo.getLocale()).toBeNull();
      expect(personalInfo.getTimeZone()).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('should convert entity to persistence model', () => {
      const personalInfo = new UserPersonalInfo(
        'info-id-123',
        userId,
        '+1234567890',
        'en-US',
        'America/New_York',
        createdAt,
        updatedAt
      );

      const persistence = personalInfo.toPersistence();

      expect(persistence).toEqual({
        id: 'info-id-123',
        userId: userId.toString(),
        phone: '+1234567890',
        locale: 'en-US',
        timeZone: 'America/New_York',
        createdAt,
        updatedAt
      });
    });

    it('should convert entity with null values to persistence', () => {
      const personalInfo = new UserPersonalInfo(
        'info-id-123',
        userId,
        null,
        null,
        null,
        createdAt,
        updatedAt
      );

      const persistence = personalInfo.toPersistence();

      expect(persistence.phone).toBeNull();
      expect(persistence.locale).toBeNull();
      expect(persistence.timeZone).toBeNull();
    });
  });

  describe('getters', () => {
    let personalInfo: UserPersonalInfo;

    beforeEach(() => {
      personalInfo = new UserPersonalInfo(
        'info-id-123',
        userId,
        '+1234567890',
        'en-US',
        'America/New_York',
        createdAt,
        updatedAt
      );
    });

    it('should return correct id', () => {
      expect(personalInfo.getId()).toBe('info-id-123');
    });

    it('should return correct userId', () => {
      expect(personalInfo.getUserId()).toEqual(userId);
    });

    it('should return correct phone', () => {
      expect(personalInfo.getPhone()).toBe('+1234567890');
    });

    it('should return correct locale', () => {
      expect(personalInfo.getLocale()).toBe('en-US');
    });

    it('should return correct timeZone', () => {
      expect(personalInfo.getTimeZone()).toBe('America/New_York');
    });

    it('should return correct createdAt', () => {
      expect(personalInfo.getCreatedAt()).toEqual(createdAt);
    });

    it('should return correct updatedAt', () => {
      expect(personalInfo.getUpdatedAt()).toEqual(updatedAt);
    });
  });

  describe('update', () => {
    let personalInfo: UserPersonalInfo;

    beforeEach(() => {
      personalInfo = new UserPersonalInfo(
        'info-id-123',
        userId,
        '+1234567890',
        'en-US',
        'America/New_York',
        createdAt,
        updatedAt
      );
    });

    it('should update phone only', () => {
      const updated = personalInfo.update({ phone: '+9876543210' });

      expect(updated.getPhone()).toBe('+9876543210');
      expect(updated.getLocale()).toBe('en-US');
      expect(updated.getTimeZone()).toBe('America/New_York');
      expect(updated.getId()).toBe(personalInfo.getId());
      expect(updated.getUserId()).toEqual(personalInfo.getUserId());
      expect(updated.getCreatedAt()).toEqual(personalInfo.getCreatedAt());
    });

    it('should update locale only', () => {
      const updated = personalInfo.update({ locale: 'es-ES' });

      expect(updated.getLocale()).toBe('es-ES');
      expect(updated.getPhone()).toBe('+1234567890');
      expect(updated.getTimeZone()).toBe('America/New_York');
    });

    it('should update timeZone only', () => {
      const updated = personalInfo.update({ timeZone: 'Europe/London' });

      expect(updated.getTimeZone()).toBe('Europe/London');
      expect(updated.getPhone()).toBe('+1234567890');
      expect(updated.getLocale()).toBe('en-US');
    });

    it('should update all fields', () => {
      const updated = personalInfo.update({
        phone: '+9876543210',
        locale: 'fr-FR',
        timeZone: 'Europe/Paris'
      });

      expect(updated.getPhone()).toBe('+9876543210');
      expect(updated.getLocale()).toBe('fr-FR');
      expect(updated.getTimeZone()).toBe('Europe/Paris');
    });

    it('should set phone to null', () => {
      const updated = personalInfo.update({ phone: null });

      expect(updated.getPhone()).toBeNull();
      expect(updated.getLocale()).toBe('en-US');
    });

    it('should preserve unchanged fields', () => {
      const updated = personalInfo.update({ phone: '+9876543210' });

      expect(updated.getLocale()).toBe(personalInfo.getLocale());
      expect(updated.getTimeZone()).toBe(personalInfo.getTimeZone());
      expect(updated.getId()).toBe(personalInfo.getId());
    });

    it('should update updatedAt timestamp', () => {
      const beforeUpdate = new Date();
      const updated = personalInfo.update({ phone: '+9876543210' });
      const afterUpdate = new Date();

      const updatedTimestamp = updated.getUpdatedAt();
      expect(updatedTimestamp.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(updatedTimestamp.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
      expect(updatedTimestamp.getTime()).toBeGreaterThan(updatedAt.getTime());
    });

    it('should preserve createdAt when updating', () => {
      const updated = personalInfo.update({ phone: '+9876543210' });

      expect(updated.getCreatedAt()).toEqual(personalInfo.getCreatedAt());
    });
  });
});











