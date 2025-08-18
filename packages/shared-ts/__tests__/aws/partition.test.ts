/**
 * @file partition.test.ts
 * @summary Tests for AWS partition detection.
 */

import { partitionForRegion } from '../../src/aws/partition.js';

describe('partitionForRegion', () => {
  it('returns aws-cn for China regions', () => {
    expect(partitionForRegion('cn-north-1')).toBe('aws-cn');
    expect(partitionForRegion('CN-NORTHWEST-1')).toBe('aws-cn'); // case-insensitive via toLowerCase
  });

  it('returns aws-us-gov for GovCloud regions', () => {
    expect(partitionForRegion('us-gov-west-1')).toBe('aws-us-gov');
    expect(partitionForRegion('us-gov-east-1')).toBe('aws-us-gov');
  });

  it('returns aws otherwise', () => {
    expect(partitionForRegion('us-east-1')).toBe('aws');
    expect(partitionForRegion('eu-central-1')).toBe('aws');
  });
});
