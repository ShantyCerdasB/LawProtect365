/**
 * @file errors.test.ts
 * @summary Tests for AWS error shape extraction and classifiers.
 */

import {
  extractAwsError,
  isAwsThrottling,
  isAwsAccessDenied,
  isAwsServiceUnavailable,
  isAwsRetryable} from '../../src/aws/errors.js';

describe('extractAwsError', () => {
  it('reads smithy $metadata.httpStatusCode', () => {
    const e = { name: 'Foo', code: 'Bar', message: 'boom', $metadata: { httpStatusCode: 503 } };
    expect(extractAwsError(e)).toEqual({
      name: 'Foo',
      code: 'Bar',
      message: 'boom',
      statusCode: 503});
  });

  it('falls back to statusCode and string properties', () => {
    const e = { name: 'X', code: 'Y', message: 'msg', statusCode: 403 };
    expect(extractAwsError(e)).toEqual({ name: 'X', code: 'Y', message: 'msg', statusCode: 403 });
  });

  it('returns undefined fields when absent', () => {
    expect(extractAwsError({})).toEqual({
      name: undefined,
      code: undefined,
      message: undefined,
      statusCode: undefined});
  });
});

describe('isAwsThrottling', () => {
  it('matches 429 status', () => {
    expect(isAwsThrottling({ statusCode: 429 })).toBe(true);
  });

  it('matches known throttling names/codes', () => {
    expect(isAwsThrottling({ name: 'ThrottlingException' })).toBe(true);
    expect(isAwsThrottling({ code: 'ProvisionedThroughputExceededException' })).toBe(true);
  });

  it('returns false otherwise', () => {
    expect(isAwsThrottling({ statusCode: 400 })).toBe(false);
  });
});

describe('isAwsAccessDenied', () => {
  it('matches 403 status', () => {
    expect(isAwsAccessDenied({ statusCode: 403 })).toBe(true);
  });

  it('matches known names', () => {
    expect(isAwsAccessDenied({ name: 'AccessDenied' })).toBe(true);
    expect(isAwsAccessDenied({ code: 'AccessDeniedException' })).toBe(true);
  });

  it('returns false otherwise', () => {
    expect(isAwsAccessDenied({ statusCode: 404 })).toBe(false);
  });
});

describe('isAwsServiceUnavailable', () => {
  it('matches 5xx', () => {
    expect(isAwsServiceUnavailable({ statusCode: 500 })).toBe(true);
    expect(isAwsServiceUnavailable({ statusCode: 503 })).toBe(true);
  });

  it('matches specific names', () => {
    expect(isAwsServiceUnavailable({ name: 'ServiceUnavailable' })).toBe(true);
    expect(isAwsServiceUnavailable({ code: 'InternalFailure' })).toBe(true);
  });

  it('returns false otherwise', () => {
    expect(isAwsServiceUnavailable({ statusCode: 404 })).toBe(false);
  });
});

describe('isAwsRetryable', () => {
  it('is true for throttling or 5xx', () => {
    expect(isAwsRetryable({ statusCode: 429 })).toBe(true);
    expect(isAwsRetryable({ statusCode: 502 })).toBe(true);
  });

  it('is false for non-retryable', () => {
    expect(isAwsRetryable({ statusCode: 400 })).toBe(false);
  });
});
