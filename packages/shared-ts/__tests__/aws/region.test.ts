/**
 * @file region.test.ts
 * @summary Tests for region helpers: getDefaultRegion, requireRegion, detectPartition, isValidRegion.
 */

import { getDefaultRegion, requireRegion, detectPartition, isValidRegion } from '../../src/aws/region.js';

const ENV = process.env;

describe('getDefaultRegion', () => {
  beforeEach(() => {
    process.env = { ...ENV };
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;
  });
  afterAll(() => {
    process.env = ENV;
  });

  it('reads AWS_REGION', () => {
    process.env.AWS_REGION = 'eu-west-1';
    expect(getDefaultRegion()).toBe('eu-west-1');
  });

  it('falls back to AWS_DEFAULT_REGION', () => {
    process.env.AWS_DEFAULT_REGION = 'ap-southeast-2';
    expect(getDefaultRegion()).toBe('ap-southeast-2');
  });

  it('returns undefined when not set', () => {
    expect(getDefaultRegion()).toBeUndefined();
  });
});

describe('requireRegion', () => {
  afterEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;
  });

  it('returns provided region', () => {
    expect(requireRegion('us-east-1')).toBe('us-east-1');
  });

  it('falls back to env', () => {
    process.env.AWS_REGION = 'eu-north-1';
    expect(requireRegion()).toBe('eu-north-1');
  });

  it('throws when neither input nor env is available', () => {
    expect(() => requireRegion()).toThrow(/AWS region not configured/i);
  });
});

describe('detectPartition', () => {
  it('delegates to partitionForRegion', () => {
    expect(detectPartition('us-gov-west-1')).toBe('aws-us-gov');
    expect(detectPartition('cn-north-1')).toBe('aws-cn');
    expect(detectPartition('us-east-1')).toBe('aws');
  });
});

describe('isValidRegion', () => {
  it('accepts standard region patterns', () => {
    expect(isValidRegion('us-east-1')).toBe(true);
    expect(isValidRegion('eu-central-1')).toBe(true);
  });

  it('rejects invalid patterns', () => {
    expect(isValidRegion('us-east')).toBe(false);
    expect(isValidRegion('us_east_1')).toBe(false);
    expect(isValidRegion('eu-1')).toBe(false);
    expect(isValidRegion('')).toBe(false);
  });
});
