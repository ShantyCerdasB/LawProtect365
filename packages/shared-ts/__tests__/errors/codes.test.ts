/**
 * @file codes.test.ts
 * @summary Tests for ErrorCodes and isSharedErrorCode (100% line & branch coverage).
 */

import { ErrorCodes, isSharedErrorCode, type ErrorCode } from '../../src/errors/codes.js';

describe('ErrorCodes catalog', () => {
  it('contains the expected keys with self-identical string values', () => {
    const expectedKeys = [
      'AUTH_UNAUTHORIZED',
      'AUTH_FORBIDDEN',
      'COMMON_BAD_REQUEST',
      'COMMON_NOT_FOUND',
      'COMMON_CONFLICT',
      'COMMON_UNSUPPORTED_MEDIA_TYPE',
      'COMMON_UNPROCESSABLE_ENTITY',
      'COMMON_TOO_MANY_REQUESTS',
      'COMMON_INTERNAL_ERROR',
      'COMMON_NOT_IMPLEMENTED',
    ] as const;

    // Keys present
    expect(Object.keys(ErrorCodes).sort()).toEqual([...expectedKeys].sort());

    // Each value equals its key
    for (const k of expectedKeys) {
      expect(ErrorCodes[k]).toBe(k);
    }
  });
});

describe('isSharedErrorCode (type guard + behavior)', () => {
  it('returns true for all catalog codes and narrows type to ErrorCode', () => {
    const acceptsErrorCode = (c: ErrorCode) => c;

    for (const key of Object.keys(ErrorCodes)) {
      const code = key as string;

      expect(isSharedErrorCode(code)).toBe(true);

      // Type guard narrowing: inside this branch, "code" is ErrorCode
      if (isSharedErrorCode(code)) {
        const narrowed: ErrorCode = code;
        expect(acceptsErrorCode(narrowed)).toBe(code);
      }
    }
  });

  it('returns false for unknown codes and case-mismatched strings', () => {
    expect(isSharedErrorCode('NOT_A_REAL_CODE')).toBe(false);
    expect(isSharedErrorCode('common_bad_request')).toBe(false); // case sensitive
    expect(isSharedErrorCode('AUTH_unauthorized')).toBe(false);
    expect(isSharedErrorCode('')).toBe(false);
  });
});
