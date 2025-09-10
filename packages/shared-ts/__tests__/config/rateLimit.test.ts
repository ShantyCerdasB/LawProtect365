/**
 * @file rateLimit.test.ts
 * @summary Tests for defaultRateLimit (100% line & branch coverage).
 */

import { defaultRateLimit } from '../../src/config/rateLimit.js';

describe('defaultRateLimit', () => {
  /**
   * Ensures production-like inputs (case-insensitive) yield the production defaults.
   */
  it('returns prod defaults when envName is "prod" (case-insensitive)', () => {
    // Mixed case to exercise toLowerCase() path
    const cfg = defaultRateLimit('PrOd');

    expect(cfg).toEqual({
      limitPerMinute: 900,
      burst: 200,
      emitHeaders: true});
  });

  /**
   * Ensures any non-"prod" env yields the non-production defaults.
   */
  it('returns non-prod defaults when envName is not "prod"', () => {
    const devCfg = defaultRateLimit('dev');
    const stagingCfg = defaultRateLimit('staging');

    expect(devCfg).toEqual({
      limitPerMinute: 1800,
      burst: 400,
      emitHeaders: true});

    expect(stagingCfg).toEqual({
      limitPerMinute: 1800,
      burst: 400,
      emitHeaders: true});
  });
});
