/**
 * @file RateLimits.rules.test.ts
 * @summary Tests for RateLimits rules
 */

import {
  selectRateLimitConfig,
  assertRateLimit,
  toRateLimitHeaders,
  clampListPageSize} from '../../src/rules/RateLimits.rules.js';
import { AppError, ErrorCodes } from '../../src/errors/index.js';

// Mock the config module
jest.mock('../../src/config/rateLimit.js', () => ({
  defaultRateLimit: jest.fn((env: string) => ({
    limitPerMinute: env === 'prod' ? 100 : 10,
    burst: env === 'prod' ? 20 : 5,
    emitHeaders: env === 'prod'}))}));

describe('RateLimits.rules', () => {
  const originalEnv = process.env.ENV;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.ENV = originalEnv;
  });

  describe('selectRateLimitConfig', () => {
    it('should return config for dev environment by default', () => {
      delete process.env.ENV;
      const config = selectRateLimitConfig();
      
      expect(config).toEqual({
        limitPerMinute: 10,
        burst: 5,
        emitHeaders: false});
    });

    it('should return config for specified environment', () => {
      const config = selectRateLimitConfig('prod');
      
      expect(config).toEqual({
        limitPerMinute: 100,
        burst: 20,
        emitHeaders: true});
    });

    it('should use process.env.ENV when available', () => {
      process.env.ENV = 'staging';
      const config = selectRateLimitConfig();
      
      expect(config).toEqual({
        limitPerMinute: 10,
        burst: 5,
        emitHeaders: false});
    });
  });

  describe('assertRateLimit', () => {
    const defaultConfig = {
      limitPerMinute: 10,
      burst: 5,
      emitHeaders: false};

    it('should pass when usage is within limit', () => {
      expect(() => assertRateLimit(5, defaultConfig)).not.toThrow();
    });

    it('should pass when usage is at steady limit', () => {
      expect(() => assertRateLimit(10, defaultConfig)).not.toThrow();
    });

    it('should pass when usage is within burst limit', () => {
      expect(() => assertRateLimit(12, defaultConfig)).not.toThrow();
    });

    it('should pass when usage is at burst limit', () => {
      expect(() => assertRateLimit(14, defaultConfig)).not.toThrow();
    });

    it('should throw AppError when usage exceeds burst limit', () => {
      expect(() => assertRateLimit(16, defaultConfig)).toThrow(AppError);
      
      try {
        assertRateLimit(16, defaultConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe(ErrorCodes.COMMON_TOO_MANY_REQUESTS);
        expect((error as AppError).statusCode).toBe(429);
        expect((error as AppError).message).toBe('Rate limit exceeded');
      }
    });

    it('should use default config when not provided', () => {
      expect(() => assertRateLimit(5)).not.toThrow();
      expect(() => assertRateLimit(16)).toThrow(AppError);
    });

    it('should handle edge case with zero burst', () => {
      const config = { ...defaultConfig, burst: 0 };
      expect(() => assertRateLimit(9, config)).not.toThrow();
      expect(() => assertRateLimit(10, config)).toThrow(AppError);
      expect(() => assertRateLimit(11, config)).toThrow(AppError);
    });

    it('should handle edge case with zero limit', () => {
      const config = { ...defaultConfig, limitPerMinute: 0, burst: 5 };
      expect(() => assertRateLimit(0, config)).not.toThrow();
      expect(() => assertRateLimit(4, config)).not.toThrow();
      expect(() => assertRateLimit(5, config)).toThrow(AppError);
    });
  });

  describe('toRateLimitHeaders', () => {
    const config = {
      limitPerMinute: 100,
      burst: 20,
      emitHeaders: true};

    it('should return headers when emitHeaders is true', () => {
      const headers = toRateLimitHeaders(50, config);
      
      expect(headers).toEqual({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '50'});
    });

    it('should return empty object when emitHeaders is false', () => {
      const configNoHeaders = { ...config, emitHeaders: false };
      const headers = toRateLimitHeaders(50, configNoHeaders);
      
      expect(headers).toEqual({});
    });

    it('should calculate remaining correctly', () => {
      const headers = toRateLimitHeaders(75, config);
      
      expect(headers).toEqual({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '25'});
    });

    it('should not return negative remaining', () => {
      const headers = toRateLimitHeaders(150, config);
      
      expect(headers).toEqual({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0'});
    });

    it('should use default config when not provided', () => {
      const headers = toRateLimitHeaders(50);
      
      expect(headers).toEqual({});
    });

    it('should handle zero usage', () => {
      const headers = toRateLimitHeaders(0, config);
      
      expect(headers).toEqual({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '100'});
    });
  });

  describe('clampListPageSize', () => {
    it('should return requested size when within bounds', () => {
      expect(clampListPageSize(50)).toBe(50);
      expect(clampListPageSize(50, 10, 100)).toBe(50);
    });

    it('should return minimum when requested is too small', () => {
      expect(clampListPageSize(0)).toBe(1);
      expect(clampListPageSize(-5)).toBe(1);
      expect(clampListPageSize(5, 10, 100)).toBe(10);
    });

    it('should return maximum when requested is too large', () => {
      expect(clampListPageSize(150, 1, 100)).toBe(100);
    });

    it('should return minimum for non-finite values', () => {
      expect(clampListPageSize(Number.NaN)).toBe(1);
      expect(clampListPageSize(Infinity)).toBe(1);
      expect(clampListPageSize(-Infinity)).toBe(1);
    });

    it('should return minimum for undefined', () => {
      expect(clampListPageSize(undefined)).toBe(1);
    });

    it('should return minimum for null', () => {
      expect(clampListPageSize(null as any)).toBe(1);
    });

    it('should floor decimal values', () => {
      expect(clampListPageSize(50.7)).toBe(50);
      expect(clampListPageSize(50.2)).toBe(50);
    });

    it('should use default min/max values', () => {
      expect(clampListPageSize(0)).toBe(1); // default min
      expect(clampListPageSize(150)).toBe(100); // default max
    });

    it('should handle edge cases with custom bounds', () => {
      expect(clampListPageSize(5, 5, 5)).toBe(5); // min = max
      expect(clampListPageSize(3, 5, 5)).toBe(5); // below min
      expect(clampListPageSize(7, 5, 5)).toBe(5); // above max
    });

    it('should handle string numbers', () => {
      expect(clampListPageSize(50)).toBe(50);
      expect(clampListPageSize(150, 1, 100)).toBe(100);
    });
  });
});
