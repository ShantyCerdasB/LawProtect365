/**
 * @fileoverview DefaultMessages Tests - Unit tests for DefaultMessages
 * @summary Tests for default message templates
 * @description Comprehensive test suite for DefaultMessages covering default
 * subject and body message generation for auth service events.
 */

import { describe, it, expect } from '@jest/globals';
import { DEFAULT_AUTH_SUBJECTS, getDefaultAuthBody } from '../../../../src/domain/constants/DefaultMessages';
import { AuthServiceEventType } from '../../../../src/domain/enums';
import { DEFAULT_UNKNOWN_VALUE } from '../../../../src/domain/constants/DefaultValues';

describe('DefaultMessages', () => {
  describe('DEFAULT_AUTH_SUBJECTS', () => {
    it('contains all auth service event types', () => {
      expect(DEFAULT_AUTH_SUBJECTS[AuthServiceEventType.USER_UPDATED]).toBe('Account Updated');
      expect(DEFAULT_AUTH_SUBJECTS[AuthServiceEventType.USER_ROLE_CHANGED]).toBe('Your Role Has Changed');
      expect(DEFAULT_AUTH_SUBJECTS[AuthServiceEventType.USER_STATUS_CHANGED]).toBe('Account Status Changed');
      expect(DEFAULT_AUTH_SUBJECTS[AuthServiceEventType.MFA_STATUS_CHANGED]).toBe('MFA Settings Changed');
      expect(DEFAULT_AUTH_SUBJECTS[AuthServiceEventType.OAUTH_ACCOUNT_LINKED]).toBe('OAuth Account Linked');
      expect(DEFAULT_AUTH_SUBJECTS[AuthServiceEventType.OAUTH_ACCOUNT_UNLINKED]).toBe('OAuth Account Unlinked');
      expect(DEFAULT_AUTH_SUBJECTS[AuthServiceEventType.USER_PROVIDER_LINKED]).toBe('Provider Account Linked');
      expect(DEFAULT_AUTH_SUBJECTS[AuthServiceEventType.USER_PROVIDER_UNLINKED]).toBe('Provider Account Unlinked');
    });
  });

  describe('getDefaultAuthBody', () => {
    it('returns body for USER_UPDATED', () => {
      const result = getDefaultAuthBody(AuthServiceEventType.USER_UPDATED, 'John', {});
      expect(result).toBe('Hello John, your account information has been updated.');
    });

    it('returns body for USER_ROLE_CHANGED with oldRole and newRole', () => {
      const payload = { oldRole: 'user', newRole: 'admin' };
      const result = getDefaultAuthBody(AuthServiceEventType.USER_ROLE_CHANGED, 'John', payload);
      expect(result).toBe('Hello John, your role has been changed from user to admin.');
    });

    it('returns body for USER_ROLE_CHANGED with default values when roles missing', () => {
      const result = getDefaultAuthBody(AuthServiceEventType.USER_ROLE_CHANGED, 'John', {});
      expect(result).toBe(`Hello John, your role has been changed from ${DEFAULT_UNKNOWN_VALUE} to ${DEFAULT_UNKNOWN_VALUE}.`);
    });

    it('returns body for USER_STATUS_CHANGED with oldStatus and newStatus', () => {
      const payload = { oldStatus: 'active', newStatus: 'inactive' };
      const result = getDefaultAuthBody(AuthServiceEventType.USER_STATUS_CHANGED, 'John', payload);
      expect(result).toBe('Hello John, your account status has been changed from active to inactive.');
    });

    it('returns body for USER_STATUS_CHANGED with default values when statuses missing', () => {
      const result = getDefaultAuthBody(AuthServiceEventType.USER_STATUS_CHANGED, 'John', {});
      expect(result).toBe(`Hello John, your account status has been changed from ${DEFAULT_UNKNOWN_VALUE} to ${DEFAULT_UNKNOWN_VALUE}.`);
    });

    it('returns body for MFA_STATUS_CHANGED when mfaEnabled is true', () => {
      const payload = { mfaEnabled: true };
      const result = getDefaultAuthBody(AuthServiceEventType.MFA_STATUS_CHANGED, 'John', payload);
      expect(result).toBe('Hello John, MFA has been enabled on your account.');
    });

    it('returns body for MFA_STATUS_CHANGED when mfaEnabled is false', () => {
      const payload = { mfaEnabled: false };
      const result = getDefaultAuthBody(AuthServiceEventType.MFA_STATUS_CHANGED, 'John', payload);
      expect(result).toBe('Hello John, MFA has been disabled on your account.');
    });

    it('returns body for OAUTH_ACCOUNT_LINKED', () => {
      const result = getDefaultAuthBody(AuthServiceEventType.OAUTH_ACCOUNT_LINKED, 'John', {});
      expect(result).toBe('Hello John, an OAuth account has been linked to your account.');
    });

    it('returns body for USER_PROVIDER_LINKED', () => {
      const result = getDefaultAuthBody(AuthServiceEventType.USER_PROVIDER_LINKED, 'John', {});
      expect(result).toBe('Hello John, an OAuth account has been linked to your account.');
    });

    it('returns body for OAUTH_ACCOUNT_UNLINKED', () => {
      const result = getDefaultAuthBody(AuthServiceEventType.OAUTH_ACCOUNT_UNLINKED, 'John', {});
      expect(result).toBe('Hello John, an OAuth account has been unlinked from your account.');
    });

    it('returns body for USER_PROVIDER_UNLINKED', () => {
      const result = getDefaultAuthBody(AuthServiceEventType.USER_PROVIDER_UNLINKED, 'John', {});
      expect(result).toBe('Hello John, an OAuth account has been unlinked from your account.');
    });

    it('returns default body for unknown event type', () => {
      const result = getDefaultAuthBody('UNKNOWN_EVENT', 'John', {});
      expect(result).toBe('Hello John, there has been a change to your account.');
    });
  });
});

