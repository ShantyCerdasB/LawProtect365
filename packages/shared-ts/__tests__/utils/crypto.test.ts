import {
  sha256Hex,
  hmacSha256Hex,
  toBase64Url,
  randomBase64Url,
  timingSafeEqual,
  createHash,
  base64urlToBytes,
  pickMessageType} from '../../src/utils/crypto.js';

describe('Crypto Utils', () => {
  describe('sha256Hex', () => {
    it('should hash a string correctly', () => {
      const result = sha256Hex('hello world');
      expect(result).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
      expect(result).toHaveLength(64);
    });

    it('should hash a Buffer correctly', () => {
      const buffer = Buffer.from('hello world');
      const result = sha256Hex(buffer);
      expect(result).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    it('should produce consistent results', () => {
      const input = 'test data';
      const result1 = sha256Hex(input);
      const result2 = sha256Hex(input);
      expect(result1).toBe(result2);
    });

    it('should handle empty string', () => {
      const result = sha256Hex('');
      expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });
  });

  describe('hmacSha256Hex', () => {
    it('should create HMAC with string key and data', () => {
      const result = hmacSha256Hex('secret-key', 'message to sign');
      expect(result).toHaveLength(64);
      expect(typeof result).toBe('string');
    });

    it('should create HMAC with Buffer key and data', () => {
      const key = Buffer.from('secret-key');
      const data = Buffer.from('message to sign');
      const result = hmacSha256Hex(key, data);
      expect(result).toHaveLength(64);
    });

    it('should produce consistent results', () => {
      const key = 'secret-key';
      const data = 'message to sign';
      const result1 = hmacSha256Hex(key, data);
      const result2 = hmacSha256Hex(key, data);
      expect(result1).toBe(result2);
    });

    it('should produce different results for different keys', () => {
      const data = 'message to sign';
      const result1 = hmacSha256Hex('key1', data);
      const result2 = hmacSha256Hex('key2', data);
      expect(result1).not.toBe(result2);
    });
  });

  describe('toBase64Url', () => {
    it('should encode Buffer to base64url', () => {
      const buffer = Buffer.from('hello world');
      const result = toBase64Url(buffer);
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('should handle empty Buffer', () => {
      const buffer = Buffer.alloc(0);
      const result = toBase64Url(buffer);
      expect(result).toBe('');
    });

    it('should handle single byte Buffer', () => {
      const buffer = Buffer.from([65]); // 'A'
      const result = toBase64Url(buffer);
      expect(result).toBe('QQ');
    });

    it('should remove padding characters', () => {
      const buffer = Buffer.from('test');
      const result = toBase64Url(buffer);
      expect(result).not.toContain('=');
    });
  });

  describe('randomBase64Url', () => {
    it('should generate random token with default size', () => {
      const result = randomBase64Url();
      expect(typeof result).toBe('string');
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('should generate random token with custom size', () => {
      const result = randomBase64Url(16);
      expect(typeof result).toBe('string');
    });

    it('should generate different tokens', () => {
      const result1 = randomBase64Url(32);
      const result2 = randomBase64Url(32);
      expect(result1).not.toBe(result2);
    });

    it('should handle invalid input by using default', () => {
      const result = randomBase64Url(Number.NaN);
      expect(typeof result).toBe('string');
    });

    it('should handle zero input by using minimum size', () => {
      const result = randomBase64Url(0);
      expect(typeof result).toBe('string');
    });

    it('should handle negative input by using minimum size', () => {
      const result = randomBase64Url(-5);
      expect(typeof result).toBe('string');
    });

    it('should handle non-finite input by using default', () => {
      const result = randomBase64Url(Infinity);
      expect(typeof result).toBe('string');
    });
  });

  describe('timingSafeEqual', () => {
    it('should return true for equal strings', () => {
      const result = timingSafeEqual('hello', 'hello');
      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const result = timingSafeEqual('hello', 'world');
      expect(result).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      const result = timingSafeEqual('hello', 'hello world');
      expect(result).toBe(false);
    });

    it('should handle empty strings', () => {
      const result = timingSafeEqual('', '');
      expect(result).toBe(true);
    });

    it('should handle special characters', () => {
      const result = timingSafeEqual('hello!@#', 'hello!@#');
      expect(result).toBe(true);
    });
  });

  describe('createHash', () => {
    it('should create hash instance', () => {
      const hash = createHash('sha256');
      expect(hash).toBeDefined();
      expect(typeof hash.update).toBe('function');
      expect(typeof hash.digest).toBe('function');
    });
  });

  describe('base64urlToBytes', () => {
    it('should convert base64url to bytes', () => {
      const base64url = 'SGVsbG8gV29ybGQ';
      const result = base64urlToBytes(base64url);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Buffer.from(result).toString()).toBe('Hello World');
    });

    it('should handle base64url without padding', () => {
      const base64url = 'SGVsbG8gV29ybGQ';
      const result = base64urlToBytes(base64url);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle base64url with padding', () => {
      const base64url = 'SGVsbG8gV29ybGQ=';
      const result = base64urlToBytes(base64url);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle empty string', () => {
      const result = base64urlToBytes('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should handle single character', () => {
      const result = base64urlToBytes('QQ');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Buffer.from(result).toString()).toBe('A');
    });
  });

  describe('pickMessageType', () => {
    it('should return DIGEST for SHA_256 with 32 bytes', () => {
      const message = new Uint8Array(32);
      const result = pickMessageType(message, 'ECDSA_SHA_256');
      expect(result).toBe('DIGEST');
    });

    it('should return DIGEST for SHA_384 with 48 bytes', () => {
      const message = new Uint8Array(48);
      const result = pickMessageType(message, 'ECDSA_SHA_384');
      expect(result).toBe('DIGEST');
    });

    it('should return DIGEST for SHA_512 with 64 bytes', () => {
      const message = new Uint8Array(64);
      const result = pickMessageType(message, 'ECDSA_SHA_512');
      expect(result).toBe('DIGEST');
    });

    it('should return RAW for SHA_256 with different length', () => {
      const message = new Uint8Array(16);
      const result = pickMessageType(message, 'ECDSA_SHA_256');
      expect(result).toBe('RAW');
    });

    it('should return RAW for different algorithm', () => {
      const message = new Uint8Array(32);
      const result = pickMessageType(message, 'ECDSA_MD5');
      expect(result).toBe('RAW');
    });

    it('should return RAW when no algorithm provided', () => {
      const message = new Uint8Array(32);
      const result = pickMessageType(message);
      expect(result).toBe('RAW');
    });

    it('should return RAW when algorithm is undefined', () => {
      const message = new Uint8Array(32);
      const result = pickMessageType(message, undefined);
      expect(result).toBe('RAW');
    });

    it('should handle case insensitive algorithm names', () => {
      const message = new Uint8Array(32);
      const result = pickMessageType(message, 'ecdsa_sha_256');
      expect(result).toBe('DIGEST');
    });

    it('should handle empty algorithm string', () => {
      const message = new Uint8Array(32);
      const result = pickMessageType(message, '');
      expect(result).toBe('RAW');
    });
  });
});