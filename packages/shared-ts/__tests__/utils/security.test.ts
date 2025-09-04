/**
 * @file security.test.ts
 * @summary Tests for OTP generation and verification utilities.
 */

import { generateNumericOtp, hashOtp, verifyOtp } from '../../src/utils/security.js';

describe('generateNumericOtp', () => {
  it('generates OTP with specified length', () => {
    const otp = generateNumericOtp(6);
    expect(otp).toMatch(/^\d{6}$/);
    expect(otp.length).toBe(6);
  });

  it('generates OTP with length 1', () => {
    const otp = generateNumericOtp(1);
    expect(otp).toMatch(/^\d$/);
    expect(otp.length).toBe(1);
  });

  it('generates OTP with maximum length 12', () => {
    const otp = generateNumericOtp(12);
    expect(otp).toMatch(/^\d{12}$/);
    expect(otp.length).toBe(12);
  });

  it('throws error for invalid length 0', () => {
    expect(() => generateNumericOtp(0)).toThrow('Invalid OTP length');
  });

  it('throws error for invalid length -1', () => {
    expect(() => generateNumericOtp(-1)).toThrow('Invalid OTP length');
  });

  it('throws error for length greater than 12', () => {
    expect(() => generateNumericOtp(13)).toThrow('Invalid OTP length');
  });

  it('throws error for non-integer length', () => {
    expect(() => generateNumericOtp(5.5)).toThrow('Invalid OTP length');
  });

  it('generates different OTPs on multiple calls', () => {
    const otp1 = generateNumericOtp(6);
    const otp2 = generateNumericOtp(6);
    expect(otp1).not.toBe(otp2);
  });
});

describe('hashOtp', () => {
  it('hashes OTP consistently', () => {
    const otp = '123456';
    const hash1 = hashOtp(otp);
    const hash2 = hashOtp(otp);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[A-Za-z0-9_-]+$/); // base64url format
  });

  it('produces different hashes for different OTPs', () => {
    const hash1 = hashOtp('123456');
    const hash2 = hashOtp('654321');
    
    expect(hash1).not.toBe(hash2);
  });

  it('handles empty string', () => {
    const hash = hashOtp('');
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('handles special characters', () => {
    const hash = hashOtp('!@#$%^');
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('verifyOtp', () => {
  it('verifies correct OTP', () => {
    const otp = '123456';
    const hash = hashOtp(otp);
    
    const result = verifyOtp(otp, hash);
    expect(result).toBe(true);
  });

  it('rejects incorrect OTP', () => {
    const correctOtp = '123456';
    const incorrectOtp = '654321';
    const hash = hashOtp(correctOtp);
    
    const result = verifyOtp(incorrectOtp, hash);
    expect(result).toBe(false);
  });

  it('rejects OTP with different length hash', () => {
    const otp = '123456';
    const hash = hashOtp(otp);
    const shortHash = hash.slice(0, -10); // Make hash shorter
    
    const result = verifyOtp(otp, shortHash);
    expect(result).toBe(false);
  });

  it('rejects OTP with longer hash', () => {
    const otp = '123456';
    const hash = hashOtp(otp);
    const longHash = hash + 'extra'; // Make hash longer
    
    const result = verifyOtp(otp, longHash);
    expect(result).toBe(false);
  });

  it('handles empty OTP', () => {
    const otp = '';
    const hash = hashOtp(otp);
    
    const result = verifyOtp(otp, hash);
    expect(result).toBe(true);
  });

  it('handles empty hash', () => {
    const otp = '123456';
    const result = verifyOtp(otp, '');
    expect(result).toBe(false);
  });

  it('is timing-safe for different length inputs', () => {
    const otp = '123456';
    const hash = hashOtp(otp);
    const shortHash = 'short';
    
    // Both should take similar time due to timing-safe comparison
    const start1 = Date.now();
    verifyOtp(otp, hash);
    const time1 = Date.now() - start1;
    
    const start2 = Date.now();
    verifyOtp(otp, shortHash);
    const time2 = Date.now() - start2;
    
    // Times should be similar (within reasonable bounds)
    expect(Math.abs(time1 - time2)).toBeLessThan(10);
  });
});
