/**
 * @file aws.index.test.ts
 * @summary Verifies the AWS barrel file re-exports expected symbols from submodules.
 */

 // Mock potentially heavy/externally-coupled modules to avoid side effects on import
jest.mock('../../src/aws/ports.js', () => ({}), { virtual: true });
jest.mock('../../src/aws/s3Presign.js', () => ({}), { virtual: true });

import * as aws from '../../src/aws/index.js';

describe('aws barrel exports', () => {
  it('re-exports ARN helpers', () => {
    expect(typeof (aws as any).isArn).toBe('function');
    expect(typeof (aws as any).parseArn).toBe('function');
    expect(typeof (aws as any).formatArn).toBe('function');
    expect(typeof (aws as any).extractResourceId).toBe('function');

    // Spot-check through the barrel
    expect(aws.isArn('arn:aws:lambda:us-east-1:123456789012:function:my-fn')).toBe(true);
    const parts = aws.parseArn('arn:aws:s3:::my-bucket/key');
    expect(parts).toMatchObject({ service: 's3', region: '', accountId: '' });
    expect(aws.extractResourceId('function:my-fn')).toBe('my-fn');
  });

  it('re-exports partition helpers', () => {
    expect(typeof (aws as any).partitionForRegion).toBe('function');
    expect(aws.partitionForRegion('us-gov-west-1')).toBe('aws-us-gov');
    expect(aws.partitionForRegion('us-east-1')).toBe('aws');
  });

  it('re-exports region helpers', () => {
    expect(typeof (aws as any).getDefaultRegion).toBe('function');
    expect(typeof (aws as any).requireRegion).toBe('function');
    expect(typeof (aws as any).detectPartition).toBe('function');
    expect(typeof (aws as any).isValidRegion).toBe('function');

    expect(aws.isValidRegion('eu-central-1')).toBe(true);
    expect(aws.detectPartition('cn-north-1')).toBe('aws-cn');
  });

  it('re-exports AWS error helpers', () => {
    expect(typeof (aws as any).extractAwsError).toBe('function');
    expect(typeof (aws as any).isAwsThrottling).toBe('function');
    expect(typeof (aws as any).isAwsAccessDenied).toBe('function');
    expect(typeof (aws as any).isAwsServiceUnavailable).toBe('function');
    expect(typeof (aws as any).isAwsRetryable).toBe('function');

    const e = { name: 'ServiceUnavailable', statusCode: 503 };
    expect(aws.isAwsServiceUnavailable(e)).toBe(true);
    expect(aws.isAwsRetryable(e)).toBe(true);
  });

  it('re-exports retry helpers', () => {
    expect(typeof (aws as any).backoffDelay).toBe('function');
    expect(typeof (aws as any).shouldRetry).toBe('function');

    const d = aws.backoffDelay(0, { jitter: 'none', baseMs: 123 });
    expect(d).toBe(123);

    const r = aws.shouldRetry(0, 2, () => true, new Error(), { jitter: 'none', baseMs: 10 });
    expect(r).toEqual({ retry: true, delayMs: 10 });
  });

  it('handles optional modules safely (ports, s3Presign mocked)', () => {
    // These may or may not export things; the test ensures importing the barrel doesn't throw.
    // If the barrel adds named exports later, they can be asserted here.
    expect(aws).toBeTruthy();
  });
});
