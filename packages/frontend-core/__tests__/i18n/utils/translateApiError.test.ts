/**
 * @fileoverview Tests for translateApiError utility
 * @summary Unit tests for API error translation
 * @description Comprehensive tests for translating API error codes to user-friendly messages
 */

import { describe, it, expect, jest } from '@jest/globals';
import { translateApiError } from '../../../src/i18n/utils/translateApiError';
import type { ApiError } from '../../../src/i18n/interfaces/ApiErrorInterfaces';
import type { TFunction } from 'i18next';

describe('translateApiError', () => {
  const createMockT = (translations: Record<string, string>): TFunction => {
    const mockFn = jest.fn((key: string, options?: { defaultValue?: string; [key: string]: unknown }) => {
      if (translations[key]) {
        return translations[key];
      }
      if (options?.defaultValue) {
        return options.defaultValue as string;
      }
      return key;
    });
    return mockFn as unknown as TFunction;
  };

  it('should translate error code without field', () => {
    const t = createMockT({
      'errors.api.UNAUTHORIZED': 'You are not authorized',
    });
    const error: ApiError = { code: 'UNAUTHORIZED' };

    const result = translateApiError(t, error);

    expect(result).toBe('You are not authorized');
    expect(t).toHaveBeenCalledWith('errors.api.UNAUTHORIZED', expect.objectContaining({ defaultValue: expect.any(String) }));
  });

  it('should translate error code with field', () => {
    const t = createMockT({
      'errors.api.INVALID_INPUT.email': 'Email is invalid',
    });
    const error: ApiError = { code: 'INVALID_INPUT', field: 'email' };

    const result = translateApiError(t, error);

    expect(result).toBe('Email is invalid');
    expect(t).toHaveBeenCalledWith('errors.api.INVALID_INPUT.email', expect.objectContaining({ defaultValue: expect.any(String) }));
  });

  it('should use default value when translation key not found', () => {
    const t = createMockT({
      'errors.api.UNKNOWN_ERROR': 'An unknown error occurred',
    });
    const error: ApiError = { code: 'NOT_FOUND_TRANSLATION' };

    const result = translateApiError(t, error);

    expect(result).toBe('An unknown error occurred');
    expect(t).toHaveBeenCalledWith('errors.api.NOT_FOUND_TRANSLATION', expect.objectContaining({ defaultValue: 'An unknown error occurred' }));
  });

  it('should return UNKNOWN_ERROR when translation key equals error key', () => {
    const t = createMockT({
      'errors.api.UNKNOWN_ERROR': 'An unknown error occurred',
    });
    const error: ApiError = { code: 'MISSING_KEY' };

    const result = translateApiError(t, error);

    expect(result).toBe('An unknown error occurred');
  });

  it('should pass params to translation function', () => {
    const t = createMockT({
      'errors.api.VALIDATION_ERROR': 'Validation failed: {{message}}',
    });
    const error: ApiError = {
      code: 'VALIDATION_ERROR',
      params: { message: 'Field required' },
    };

    const result = translateApiError(t, error);

    expect(result).toBe('Validation failed: {{message}}');
    expect(t).toHaveBeenCalledWith('errors.api.VALIDATION_ERROR', expect.objectContaining({ defaultValue: expect.any(String), message: 'Field required' }));
  });

  it('should handle error with field and params', () => {
    const t = createMockT({
      'errors.api.INVALID_INPUT.username': 'Username {{minLength}} characters minimum',
    });
    const error: ApiError = {
      code: 'INVALID_INPUT',
      field: 'username',
      params: { minLength: 3 },
    };

    const result = translateApiError(t, error);

    expect(result).toBe('Username {{minLength}} characters minimum');
    expect(t).toHaveBeenCalledWith('errors.api.INVALID_INPUT.username', expect.objectContaining({ defaultValue: expect.any(String), minLength: 3 }));
  });

  it('should prioritize field-specific translation over general translation', () => {
    const t = createMockT({
      'errors.api.INVALID_INPUT': 'Input is invalid',
      'errors.api.INVALID_INPUT.email': 'Email format is invalid',
    });
    const error: ApiError = { code: 'INVALID_INPUT', field: 'email' };

    const result = translateApiError(t, error);

    expect(result).toBe('Email format is invalid');
    expect(t).toHaveBeenCalledWith('errors.api.INVALID_INPUT.email', expect.any(Object));
  });

  it('should handle empty params object', () => {
    const t = createMockT({
      'errors.api.ERROR_CODE': 'Error message',
    });
    const error: ApiError = { code: 'ERROR_CODE', params: {} };

    const result = translateApiError(t, error);

    expect(result).toBe('Error message');
  });
});


