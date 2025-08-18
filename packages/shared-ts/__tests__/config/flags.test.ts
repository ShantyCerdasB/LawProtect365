/**
 * @file flags.test.ts
 * @summary Tests for loadFeatureFlags (100% line & branch coverage).
 */

import { loadFeatureFlags } from '../../src/config/flags.js';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  // Fresh copy of env for each test
  process.env = { ...ORIGINAL_ENV };

  // Remove any leftover FF_/FEAT_ keys so tests are isolated
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('FF_') || k.startsWith('FEAT_')) {
      delete (process.env as any)[k];
    }
  }
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('loadFeatureFlags', () => {
  it('uses the default "FF_" prefix and parses truthy/falsy values case-insensitively', () => {
    // Truthy (mixed case)
    process.env.FF_ENABLE_METRICS = '1';
    process.env.FF_DEBUG_CORS = 'true';
    process.env.FF_VERBOSE = 'YeS';
    process.env.FF_TOGGLE = 'oN';

    // Falsy
    process.env.FF_OFF = 'no';
    process.env.FF_ZERO = '0';
    process.env.FF_DISABLED = 'FALSE';
    process.env.FF_RANDOM = 'maybe'; // anything else => false

    // Non-prefixed -> ignored
    process.env.OTHER_VAR = 'on';

    const flags = loadFeatureFlags();

    expect(flags).toEqual({
      ENABLE_METRICS: true,
      DEBUG_CORS: true,
      VERBOSE: true,
      TOGGLE: true,
      OFF: false,
      ZERO: false,
      DISABLED: false,
      RANDOM: false,
    });

    expect(Object.keys(flags)).not.toContain('OTHER_VAR');
  });

  it('accepts a custom prefix and ignores keys from other prefixes', () => {
    process.env.FEAT_BETA = 'on';
    process.env.FEAT_EXPERIMENT = 'OFF';

    // Should be ignored when using "FEAT_" prefix
    process.env.FF_SHOULD_IGNORE = 'on';

    const flags = loadFeatureFlags('FEAT_');

    expect(flags).toEqual({
      BETA: true,        // "on" -> true
      EXPERIMENT: false, // "OFF" -> false
    });

    expect(Object.keys(flags)).not.toContain('SHOULD_IGNORE');
  });

  it('skips entries with nullish values (exercises v == null path)', () => {
    const spy = jest
      .spyOn(Object, 'entries')
      // Return synthetic entries to reliably include a null value
      .mockImplementation(() => [
        ['FF_VALID', 'yes'],         // should be parsed -> true
        ['FF_NULLISH', null as any], // should be skipped due to v == null
        ['OTHER_NO_PREFIX', 'on'],   // should be skipped due to prefix check
      ]);

    try {
      const flags = loadFeatureFlags(); // default prefix "FF_"
      expect(flags).toEqual({ VALID: true });
      expect(Object.keys(flags)).not.toContain('NULLISH');
    } finally {
      spy.mockRestore();
    }
  });
});
