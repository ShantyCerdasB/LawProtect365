/**
 * @fileoverview AuthServiceEventSchemas Tests - Unit tests for auth service event schemas
 * @summary Tests for Zod validation schemas for auth service events
 * @description Comprehensive test suite for AuthServiceEventSchemas covering
 * validation of all auth service event types and their payloads.
 */

import { describe, it, expect } from '@jest/globals';
import {
  UserRegisteredEventSchema,
  UserUpdatedEventSchema,
  UserRoleChangedEventSchema,
  UserStatusChangedEventSchema,
  MfaStatusChangedEventSchema,
  GenericAuthServiceEventSchema,
} from '../../../../src/domain/schemas/AuthServiceEventSchemas';

describe('AuthServiceEventSchemas', () => {
  describe('UserRegisteredEventSchema', () => {
    it('validates valid user registered event', () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      expect(() => UserRegisteredEventSchema.parse(payload)).not.toThrow();
    });

    it('validates with optional fields missing', () => {
      const payload = {
        email: 'test@example.com',
      };
      expect(() => UserRegisteredEventSchema.parse(payload)).not.toThrow();
    });

    it('validates with recipientLanguage', () => {
      const payload = {
        email: 'test@example.com',
        recipientLanguage: 'en',
      };
      expect(() => UserRegisteredEventSchema.parse(payload)).not.toThrow();
    });

    it('validates with language', () => {
      const payload = {
        email: 'test@example.com',
        language: 'es',
      };
      expect(() => UserRegisteredEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects invalid email', () => {
      const payload = {
        email: 'invalid-email',
      };
      expect(() => UserRegisteredEventSchema.parse(payload)).toThrow();
    });

    it('allows additional fields', () => {
      const payload = {
        email: 'test@example.com',
        extraField: 'value',
      };
      expect(() => UserRegisteredEventSchema.parse(payload)).not.toThrow();
    });
  });

  describe('UserUpdatedEventSchema', () => {
    it('validates valid user updated event', () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
      };
      expect(() => UserUpdatedEventSchema.parse(payload)).not.toThrow();
    });

    it('validates with optional fields missing', () => {
      const payload = {
        email: 'test@example.com',
      };
      expect(() => UserUpdatedEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects invalid email', () => {
      const payload = {
        email: 'invalid',
      };
      expect(() => UserUpdatedEventSchema.parse(payload)).toThrow();
    });
  });

  describe('UserRoleChangedEventSchema', () => {
    it('validates valid user role changed event', () => {
      const payload = {
        email: 'test@example.com',
        oldRole: 'user',
        newRole: 'admin',
      };
      expect(() => UserRoleChangedEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects missing oldRole', () => {
      const payload = {
        email: 'test@example.com',
        newRole: 'admin',
      };
      expect(() => UserRoleChangedEventSchema.parse(payload)).toThrow();
    });

    it('rejects missing newRole', () => {
      const payload = {
        email: 'test@example.com',
        oldRole: 'user',
      };
      expect(() => UserRoleChangedEventSchema.parse(payload)).toThrow();
    });

    it('rejects empty oldRole', () => {
      const payload = {
        email: 'test@example.com',
        oldRole: '',
        newRole: 'admin',
      };
      expect(() => UserRoleChangedEventSchema.parse(payload)).toThrow();
    });

    it('rejects empty newRole', () => {
      const payload = {
        email: 'test@example.com',
        oldRole: 'user',
        newRole: '',
      };
      expect(() => UserRoleChangedEventSchema.parse(payload)).toThrow();
    });
  });

  describe('UserStatusChangedEventSchema', () => {
    it('validates valid user status changed event', () => {
      const payload = {
        email: 'test@example.com',
        oldStatus: 'active',
        newStatus: 'inactive',
      };
      expect(() => UserStatusChangedEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects missing oldStatus', () => {
      const payload = {
        email: 'test@example.com',
        newStatus: 'inactive',
      };
      expect(() => UserStatusChangedEventSchema.parse(payload)).toThrow();
    });

    it('rejects missing newStatus', () => {
      const payload = {
        email: 'test@example.com',
        oldStatus: 'active',
      };
      expect(() => UserStatusChangedEventSchema.parse(payload)).toThrow();
    });
  });

  describe('MfaStatusChangedEventSchema', () => {
    it('validates valid MFA status changed event with mfaEnabled true', () => {
      const payload = {
        email: 'test@example.com',
        mfaEnabled: true,
      };
      expect(() => MfaStatusChangedEventSchema.parse(payload)).not.toThrow();
    });

    it('validates valid MFA status changed event with mfaEnabled false', () => {
      const payload = {
        email: 'test@example.com',
        mfaEnabled: false,
      };
      expect(() => MfaStatusChangedEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects missing mfaEnabled', () => {
      const payload = {
        email: 'test@example.com',
      };
      expect(() => MfaStatusChangedEventSchema.parse(payload)).toThrow();
    });

    it('rejects non-boolean mfaEnabled', () => {
      const payload = {
        email: 'test@example.com',
        mfaEnabled: 'true',
      };
      expect(() => MfaStatusChangedEventSchema.parse(payload)).toThrow();
    });
  });

  describe('GenericAuthServiceEventSchema', () => {
    it('validates valid generic auth service event', () => {
      const payload = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      expect(() => GenericAuthServiceEventSchema.parse(payload)).not.toThrow();
    });

    it('validates with only email', () => {
      const payload = {
        email: 'test@example.com',
      };
      expect(() => GenericAuthServiceEventSchema.parse(payload)).not.toThrow();
    });

    it('rejects invalid email', () => {
      const payload = {
        email: 'invalid',
      };
      expect(() => GenericAuthServiceEventSchema.parse(payload)).toThrow();
    });
  });
});


