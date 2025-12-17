/**
 * @fileoverview ErrorMessages Tests - Unit tests for ErrorMessages
 * @summary Tests for error message constants
 * @description Comprehensive test suite for ErrorMessages covering all
 * error message constants and templates.
 */

import { describe, it, expect } from '@jest/globals';
import { ERROR_EMAIL_DISABLED, ERROR_SMS_DISABLED, ERROR_PUSH_DISABLED, ERROR_UNSUPPORTED_CHANNEL } from '../../../../src/domain/constants/ErrorMessages';

describe('ErrorMessages', () => {
  it('defines ERROR_EMAIL_DISABLED', () => {
    expect(ERROR_EMAIL_DISABLED).toBe('Email notifications are disabled');
  });

  it('defines ERROR_SMS_DISABLED', () => {
    expect(ERROR_SMS_DISABLED).toBe('SMS notifications are disabled');
  });

  it('defines ERROR_PUSH_DISABLED', () => {
    expect(ERROR_PUSH_DISABLED).toBe('Push notifications are disabled');
  });

  it('ERROR_UNSUPPORTED_CHANNEL returns formatted message', () => {
    const result = ERROR_UNSUPPORTED_CHANNEL('INVALID');
    expect(result).toBe('Unsupported notification channel: INVALID');
  });
});

