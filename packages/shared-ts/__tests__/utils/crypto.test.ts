/**
 * @file crypto.test.ts
 * @summary Tests for cryptographic utilities.
 */

import {
  sha256Hex,
  hmacSha256Hex,
  toBase64Url,
  randomBase64Url,
  timingSafeEqual,
  createHash,
} from '../../src/utils/crypto.js';

describe('sha256Hex', () => {
  it('hashes string correctly', () => {
    const result = sha256Hex('test string');
    expect(result).toMatch(/^[a-f0-9]{64}$/);
    expect(result).toBe('d5579c46dfcc7f18207013e65b44e4cb4e2c2298f4ac457ba8f82743f31e930b');
  });

  it('hashes buffer correctly', () => {
    const buffer = Buffer.from('test string', 'utf8');
    const result = sha256Hex(buffer);
    expect(result).toMatch(/^[a-f0-9]{64}$/);
    expect(result).toBe('d5579c46dfcc7f18207013e65b44e4cb4e2c2298f4ac457ba8f82743f31e930b');
  });

  it('produces consistent hashes', () => {
    const input = 'consistent input';
    const hash1 = sha256Hex(input);
    const hash2 = sha256Hex(input);
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different inputs', () => {
    const hash1 = sha256Hex('input1');
    const hash2 = sha256Hex('input2');
    expect(hash1).not.toBe(hash2);
  });
});

describe('hmacSha256Hex', () => {
  it('computes HMAC with string key and data', () => {
    const key = 'secret-key';
    const data = 'test data';
    const result = hmacSha256Hex(key, data);
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it('computes HMAC with buffer key and data', () => {
    const key = Buffer.from('secret-key', 'utf8');
    const data = Buffer.from('test data', 'utf8');
    const result = hmacSha256Hex(key, data);
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces consistent HMACs', () => {
    const key = 'secret';
    const data = 'test';
    const hmac1 = hmacSha256Hex(key, data);
    const hmac2 = hmacSha256Hex(key, data);
    expect(hmac1).toBe(hmac2);
  });

  it('produces different HMACs for different keys', () => {
    const data = 'test';
    const hmac1 = hmacSha256Hex('key1', data);
    const hmac2 = hmacSha256Hex('key2', data);
    expect(hmac1).not.toBe(hmac2);
  });

  it('produces different HMACs for different data', () => {
    const key = 'secret';
    const hmac1 = hmacSha256Hex(key, 'data1');
    const hmac2 = hmacSha256Hex(key, 'data2');
    expect(hmac1).not.toBe(hmac2);
  });
});

describe('toBase64Url', () => {
  it('converts buffer to base64url', () => {
    const buffer = Buffer.from('test data', 'utf8');
    const result = toBase64Url(buffer);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
    expect(result).not.toContain('=');
  });

  it('handles empty buffer', () => {
    const buffer = Buffer.alloc(0);
    const result = toBase64Url(buffer);
    expect(result).toBe('');
  });

  it('handles single byte buffer', () => {
    const buffer = Buffer.from([65]); // 'A' in ASCII
    const result = toBase64Url(buffer);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('handles buffer with padding requirements', () => {
    const buffer = Buffer.from('test', 'utf8');
    const result = toBase64Url(buffer);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result).not.toContain('=');
  });

  it('produces consistent results', () => {
    const buffer = Buffer.from('consistent data', 'utf8');
    const result1 = toBase64Url(buffer);
    const result2 = toBase64Url(buffer);
    expect(result1).toBe(result2);
  });

  it('handles binary data', () => {
    const buffer = Buffer.from([0x00, 0xFF, 0x7F, 0x80]);
    const result = toBase64Url(buffer);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('handles buffer with multiple padding characters', () => {
    // Create a buffer that would result in multiple '=' padding characters
    const buffer = Buffer.from([0x00, 0x00, 0x00]); // 3 bytes = 4 base64 chars with 1 padding
    const result = toBase64Url(buffer);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result).not.toContain('=');
  });

  it('handles buffer with single padding character', () => {
    // Create a buffer that would result in one '=' padding character
    const buffer = Buffer.from([0x00, 0x00]); // 2 bytes = 3 base64 chars with 1 padding
    const result = toBase64Url(buffer);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result).not.toContain('=');
  });

  it('handles buffer with no padding required', () => {
    // Create a buffer that doesn't need padding
    const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]); // 4 bytes = 6 base64 chars, no padding
    const result = toBase64Url(buffer);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result).not.toContain('=');
  });

  it('handles buffer with all padding characters', () => {
    // Create a buffer that would result in all '=' padding characters
    const buffer = Buffer.from([0x00]); // 1 byte = 2 base64 chars with 2 padding
    const result = toBase64Url(buffer);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result).not.toContain('=');
  });

  it('handles case when Buffer.isEncoding is not available', () => {
    // Mock Buffer.isEncoding to be undefined to test the fallback path
    const originalIsEncoding = Buffer.isEncoding;
    Buffer.isEncoding = undefined as any;
    
    try {
      const buffer = Buffer.from('test data', 'utf8');
      const result = toBase64Url(buffer);
      expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    } finally {
      // Restore the original function
      Buffer.isEncoding = originalIsEncoding;
    }
  });

  it('handles case when Buffer.isEncoding returns false for base64url', () => {
    // Mock Buffer.isEncoding to return false for base64url
    const originalIsEncoding = Buffer.isEncoding;
    Buffer.isEncoding = ((encoding: string) => encoding !== 'base64url') as any;
    
    try {
      const buffer = Buffer.from('test data', 'utf8');
      const result = toBase64Url(buffer);
      expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    } finally {
      // Restore the original function
      Buffer.isEncoding = originalIsEncoding;
    }
  });

  it('handles edge case with buffer that produces only padding characters', () => {
    // Create a buffer that would produce only '=' characters in base64
    const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // 6 bytes = 8 base64 chars with 2 padding
    const result = toBase64Url(buffer);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result).not.toContain('=');
  });
});

describe('randomBase64Url', () => {
  it('generates random base64url string with default length', () => {
    const result = randomBase64Url();
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result.length).toBeGreaterThan(0);
  });

  it('generates random base64url string with specified length', () => {
    const result = randomBase64Url(16);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generates different strings on multiple calls', () => {
    const result1 = randomBase64Url(32);
    const result2 = randomBase64Url(32);
    expect(result1).not.toBe(result2);
  });

  it('handles minimum byte count', () => {
    const result = randomBase64Url(1);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('clamps negative values to minimum', () => {
    const result = randomBase64Url(-5);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('handles non-finite values', () => {
    const result = randomBase64Url(NaN);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('handles infinity values', () => {
    const result = randomBase64Url(Infinity);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('floors decimal values', () => {
    const result = randomBase64Url(5.7);
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('timingSafeEqual', () => {
  it('returns true for equal strings', () => {
    const result = timingSafeEqual('test', 'test');
    expect(result).toBe(true);
  });

  it('returns false for different strings', () => {
    const result = timingSafeEqual('test1', 'test2');
    expect(result).toBe(false);
  });

  it('returns false for strings with different lengths', () => {
    const result = timingSafeEqual('short', 'longer string');
    expect(result).toBe(false);
  });

  it('returns false for empty vs non-empty string', () => {
    const result = timingSafeEqual('', 'non-empty');
    expect(result).toBe(false);
  });

  it('returns true for empty strings', () => {
    const result = timingSafeEqual('', '');
    expect(result).toBe(true);
  });

  it('handles special characters', () => {
    const result = timingSafeEqual('test!@#', 'test!@#');
    expect(result).toBe(true);
  });

  it('handles unicode characters', () => {
    const result = timingSafeEqual('testñáé', 'testñáé');
    expect(result).toBe(true);
  });

  it('is timing-safe for different length inputs', () => {
    const short = 'short';
    const long = 'this is a much longer string';
    
    // Both should take similar time due to timing-safe comparison
    const start1 = Date.now();
    timingSafeEqual(short, long);
    const time1 = Date.now() - start1;
    
    const start2 = Date.now();
    timingSafeEqual(long, short);
    const time2 = Date.now() - start2;
    
    // Times should be similar (within reasonable bounds)
    expect(Math.abs(time1 - time2)).toBeLessThan(10);
  });
});

describe('createHash', () => {
  it('re-exports Node.js createHash function', () => {
    expect(typeof createHash).toBe('function');
    expect(createHash).toBe(require('node:crypto').createHash);
  });

  it('can be used to create hash instances', () => {
    const hash = createHash('sha256');
    expect(hash).toBeDefined();
    expect(typeof hash.update).toBe('function');
    expect(typeof hash.digest).toBe('function');
  });

  it('works with update and digest', () => {
    const hash = createHash('sha256');
    hash.update('test data');
    const digest = hash.digest('hex');
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
  });
});
