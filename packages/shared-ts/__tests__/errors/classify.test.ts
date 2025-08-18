/**
 * @file classify.test.ts
 * @summary Tests for isOperational, isRetryable, isClientError, isServerError (100% line & branch coverage).
 */

import { isOperational, isRetryable, isClientError, isServerError } from '../../src/errors/classify.js';
import { AppError } from '../../src/errors/AppError.js';

describe('isOperational', () => {
  it('returns true for AppError instances (operational)', () => {
    const err = new AppError('AUTH_UNAUTHORIZED' as any, 401, 'nope');
    expect(isOperational(err)).toBe(true);
  });

  it('returns false for non-AppError objects even if isOperational is true', () => {
    const notApp = { name: 'Whatever', isOperational: true };
    expect(isOperational(notApp)).toBe(false);
  });

  it('returns false for plain Error', () => {
    expect(isOperational(new Error('boom'))).toBe(false);
  });
});

describe('isRetryable', () => {
  it('matches on error name', () => {
    const e1 = { name: 'ThrottlingException' };
    const e2 = { name: 'TooManyRequestsException' };
    const e3 = { name: 'ProvisionedThroughputExceededException' };
    const e4 = { name: 'RequestLimitExceeded' };
    const e5 = { name: 'LimitExceededException' };
    const e6 = { name: 'ServiceQuotaExceededException' };

    [e1, e2, e3, e4, e5, e6].forEach((e) => expect(isRetryable(e)).toBe(true));
  });

  it('matches on error code', () => {
    const e = { code: 'ThrottlingException' };
    expect(isRetryable(e)).toBe(true);
  });

  it('returns false when neither name nor code match', () => {
    expect(isRetryable({ name: 'OtherError', code: 'OTHER' })).toBe(false);
    expect(isRetryable({})).toBe(false);
    expect(isRetryable(undefined)).toBe(false as any);
  });
});

describe('isClientError', () => {
  it('is true for 4xx and false otherwise (boundaries covered)', () => {
    expect(isClientError(399)).toBe(false);
    expect(isClientError(400)).toBe(true);
    expect(isClientError(499)).toBe(true);
    expect(isClientError(500)).toBe(false);
  });
});

describe('isServerError', () => {
  it('is true for 5xx and false otherwise (boundaries covered)', () => {
    expect(isServerError(499)).toBe(false);
    expect(isServerError(500)).toBe(true);
    expect(isServerError(599)).toBe(true);
    expect(isServerError(600)).toBe(false);
  });
});
