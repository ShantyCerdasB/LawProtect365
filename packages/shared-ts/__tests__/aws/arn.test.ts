/**
 * @file arn.test.ts
 * @summary Tests for ARN parsing, formatting, and resource id extraction.
 */

import { isArn, parseArn, formatArn, extractResourceId } from '../../src/aws/arn.js';

describe('isArn', () => {
  it('accepts well-formed ARNs', () => {
    expect(isArn('arn:aws:lambda:us-east-1:123456789012:function:my-fn')).toBe(true);
    expect(isArn('arn:aws:s3:::my-bucket/path/to/key')).toBe(true); // empty region/account ok for s3
  });

  it('rejects non-ARN strings', () => {
    expect(isArn('aws:lambda:us-east-1:123:function:fn')).toBe(false);
    expect(isArn('arn:aws::::')).toBe(false);
    expect(isArn('')).toBe(false);
  });
});

describe('parseArn', () => {
  it('splits components correctly', () => {
    const arn = 'arn:aws:lambda:us-east-1:123456789012:function:my-fn';
    const p = parseArn(arn);
    expect(p).toEqual({
      partition: 'aws',
      service: 'lambda',
      region: 'us-east-1',
      accountId: '123456789012',
      resource: 'function:my-fn',
    });
  });

  it('handles services with empty region/account', () => {
    const arn = 'arn:aws:s3:::my-bucket/key';
    const p = parseArn(arn);
    expect(p.partition).toBe('aws');
    expect(p.service).toBe('s3');
    expect(p.region).toBe('');
    expect(p.accountId).toBe('');
    expect(p.resource).toBe('my-bucket/key');
  });

  it('throws for invalid input', () => {
    expect(() => parseArn('nope')).toThrow(/Invalid ARN/i);
  });
});

describe('formatArn', () => {
  it('reconstructs the ARN from parts', () => {
    const arn = formatArn({
      partition: 'aws-us-gov',
      service: 'kms',
      region: 'us-gov-west-1',
      accountId: '111122223333',
      resource: 'key/abcd-1234',
    });
    expect(arn).toBe('arn:aws-us-gov:kms:us-gov-west-1:111122223333:key/abcd-1234');
  });
});

describe('extractResourceId', () => {
  it('returns id for slash form', () => {
    expect(extractResourceId('function/my-fn')).toBe('my-fn');
    expect(extractResourceId('key/a/b/c')).toBe('a/b/c');
  });

  it('returns id for colon form', () => {
    expect(extractResourceId('function:my-fn')).toBe('my-fn');
    expect(extractResourceId('table:users:v1')).toBe('users:v1');
  });

  it('returns input when no separator present', () => {
    expect(extractResourceId('queue1')).toBe('queue1');
  });
});
