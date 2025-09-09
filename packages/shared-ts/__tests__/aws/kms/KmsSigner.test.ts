/**
 * @file KmsSigner.test.ts
 * @summary Tests for KMS signer implementation
 * @description Comprehensive tests for the KmsSigner class covering encryption, decryption, signing, and verification operations
 */

import { KmsSigner } from '../../../src/aws/kms/KmsSigner.js';
import { KMSClient, EncryptCommand, DecryptCommand, SignCommand, VerifyCommand } from '@aws-sdk/client-kms';
import { BadRequestError, InternalError, ErrorCodes } from '../../../src/errors/index.js';

// Mock AWS SDK
jest.mock('@aws-sdk/client-kms');
jest.mock('../../../src/index.js', () => ({
  ...jest.requireActual('../../../src/index.js'),
  mapAwsError: jest.fn((err, op) => err),
  shouldRetry: jest.fn(() => ({ retry: false, delayMs: 0 })),
  isAwsRetryable: jest.fn(() => false),
  pickMessageType: jest.fn(() => 'RAW'),
  sleep: jest.fn(() => Promise.resolve()),
}));

describe('KmsSigner', () => {
  let mockKmsClient: any;
  let kmsSigner: KmsSigner;

  beforeEach(() => {
    jest.clearAllMocks();
    mockKmsClient = {
      send: jest.fn(),
    };
    
    kmsSigner = new KmsSigner(mockKmsClient, {
      defaultKeyId: 'test-key-id',
      defaultSigningAlgorithm: 'RSASSA_PSS_SHA_256',
      maxAttempts: 3,
    });
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const signer = new KmsSigner(mockKmsClient);
      expect(signer).toBeInstanceOf(KmsSigner);
    });

    it('should use provided options', () => {
      const options = {
        defaultKeyId: 'custom-key',
        defaultSigningAlgorithm: 'ECDSA_SHA_256' as const,
        maxAttempts: 5,
      };
      const signer = new KmsSigner(mockKmsClient, options);
      expect(signer).toBeInstanceOf(KmsSigner);
    });

    it('should handle back-compat options', () => {
      const options = {
        signerKeyId: 'back-compat-key',
        signingAlgorithm: 'ECDSA_SHA_384' as const,
      };
      const signer = new KmsSigner(mockKmsClient, options);
      expect(signer).toBeInstanceOf(KmsSigner);
    });
  });

  describe('encrypt', () => {
    const mockPlaintext = new Uint8Array([1, 2, 3, 4]);
    const mockCiphertext = new Uint8Array([5, 6, 7, 8]);

    it('should encrypt successfully with default key', async () => {
      mockKmsClient.send.mockResolvedValueOnce({
        CiphertextBlob: mockCiphertext,
      });

      const result = await kmsSigner.encrypt({
        plaintext: mockPlaintext,
      } as any);

      expect(result).toEqual({ ciphertext: mockCiphertext });
      expect(mockKmsClient.send).toHaveBeenCalledWith(
        expect.any(EncryptCommand)
      );
    });

    it('should encrypt with custom key and context', async () => {
      const customKeyId = 'custom-key-id';
      const context = { purpose: 'test' };
      
      mockKmsClient.send.mockResolvedValueOnce({
        CiphertextBlob: mockCiphertext,
      });

      const result = await kmsSigner.encrypt({
        keyId: customKeyId,
        plaintext: mockPlaintext,
        context,
      });

      expect(result).toEqual({ ciphertext: mockCiphertext });
      expect(mockKmsClient.send).toHaveBeenCalledWith(
        expect.any(EncryptCommand)
      );
    });

    it('should throw BadRequestError when keyId is missing', async () => {
      const signerWithoutDefaultKey = new KmsSigner(mockKmsClient);
      
      await expect(signerWithoutDefaultKey.encrypt({
        plaintext: mockPlaintext,
      } as any)).rejects.toThrow(BadRequestError);
    });

    it('should throw InternalError when KMS returns empty ciphertext', async () => {
      mockKmsClient.send.mockResolvedValueOnce({
        CiphertextBlob: undefined,
      });

      await expect(kmsSigner.encrypt({
        plaintext: mockPlaintext,
      } as any)).rejects.toThrow(InternalError);
    });

    it('should handle AWS errors', async () => {
      const awsError = new Error('AWS Error');
      mockKmsClient.send.mockRejectedValueOnce(awsError);

      await expect(kmsSigner.encrypt({
        plaintext: mockPlaintext,
      } as any)).rejects.toThrow(awsError);
    });
  });

  describe('decrypt', () => {
    const mockCiphertext = new Uint8Array([5, 6, 7, 8]);
    const mockPlaintext = new Uint8Array([1, 2, 3, 4]);

    it('should decrypt successfully', async () => {
      mockKmsClient.send.mockResolvedValueOnce({
        Plaintext: mockPlaintext,
      });

      const result = await kmsSigner.decrypt({
        ciphertext: mockCiphertext,
      });

      expect(result).toEqual({ plaintext: mockPlaintext });
      expect(mockKmsClient.send).toHaveBeenCalledWith(
        expect.any(DecryptCommand)
      );
    });

    it('should decrypt with encryption context', async () => {
      const context = { purpose: 'test' };
      
      mockKmsClient.send.mockResolvedValueOnce({
        Plaintext: mockPlaintext,
      });

      const result = await kmsSigner.decrypt({
        ciphertext: mockCiphertext,
        context,
      });

      expect(result).toEqual({ plaintext: mockPlaintext });
      expect(mockKmsClient.send).toHaveBeenCalledWith(
        expect.any(DecryptCommand)
      );
    });

    it('should throw InternalError when KMS returns empty plaintext', async () => {
      mockKmsClient.send.mockResolvedValueOnce({
        Plaintext: undefined,
      });

      await expect(kmsSigner.decrypt({
        ciphertext: mockCiphertext,
      })).rejects.toThrow(InternalError);
    });

    it('should handle AWS errors', async () => {
      const awsError = new Error('AWS Error');
      mockKmsClient.send.mockRejectedValueOnce(awsError);

      await expect(kmsSigner.decrypt({
        ciphertext: mockCiphertext,
      })).rejects.toThrow(awsError);
    });
  });

  describe('sign', () => {
    const mockMessage = new Uint8Array([1, 2, 3, 4]);
    const mockSignature = new Uint8Array([5, 6, 7, 8]);

    it('should sign successfully with default key and algorithm', async () => {
      mockKmsClient.send.mockResolvedValueOnce({
        Signature: mockSignature,
      });

      const result = await kmsSigner.sign({
        message: mockMessage,
      } as any);

      expect(result).toEqual({ signature: mockSignature });
      expect(mockKmsClient.send).toHaveBeenCalledWith(
        expect.any(SignCommand)
      );
    });

    it('should sign with custom key and algorithm', async () => {
      const customKeyId = 'custom-key-id';
      const customAlgorithm = 'ECDSA_SHA_256';
      
      mockKmsClient.send.mockResolvedValueOnce({
        Signature: mockSignature,
      });

      const result = await kmsSigner.sign({
        keyId: customKeyId,
        signingAlgorithm: customAlgorithm,
        message: mockMessage,
      });

      expect(result).toEqual({ signature: mockSignature });
      expect(mockKmsClient.send).toHaveBeenCalledWith(
        expect.any(SignCommand)
      );
    });

    it('should throw BadRequestError when keyId is missing', async () => {
      const signerWithoutDefaultKey = new KmsSigner(mockKmsClient);
      
      await expect(signerWithoutDefaultKey.sign({
        message: mockMessage,
      } as any)).rejects.toThrow(BadRequestError);
    });

    it('should throw InternalError when KMS returns empty signature', async () => {
      mockKmsClient.send.mockResolvedValueOnce({
        Signature: undefined,
      });

      await expect(kmsSigner.sign({
        message: mockMessage,
      } as any)).rejects.toThrow(InternalError);
    });

    it('should handle AWS errors', async () => {
      const awsError = new Error('AWS Error');
      mockKmsClient.send.mockRejectedValueOnce(awsError);

      await expect(kmsSigner.sign({
        message: mockMessage,
      } as any)).rejects.toThrow(awsError);
    });
  });

  describe('verify', () => {
    const mockMessage = new Uint8Array([1, 2, 3, 4]);
    const mockSignature = new Uint8Array([5, 6, 7, 8]);

    it('should verify successfully with valid signature', async () => {
      mockKmsClient.send.mockResolvedValueOnce({
        SignatureValid: true,
      });

      const result = await kmsSigner.verify({
        message: mockMessage,
        signature: mockSignature,
      } as any);

      expect(result).toEqual({ valid: true });
      expect(mockKmsClient.send).toHaveBeenCalledWith(
        expect.any(VerifyCommand)
      );
    });

    it('should verify with invalid signature', async () => {
      mockKmsClient.send.mockResolvedValueOnce({
        SignatureValid: false,
      });

      const result = await kmsSigner.verify({
        message: mockMessage,
        signature: mockSignature,
      } as any);

      expect(result).toEqual({ valid: false });
    });

    it('should verify with custom key and algorithm', async () => {
      const customKeyId = 'custom-key-id';
      const customAlgorithm = 'ECDSA_SHA_256';
      
      mockKmsClient.send.mockResolvedValueOnce({
        SignatureValid: true,
      });

      const result = await kmsSigner.verify({
        keyId: customKeyId,
        signingAlgorithm: customAlgorithm,
        message: mockMessage,
        signature: mockSignature,
      });

      expect(result).toEqual({ valid: true });
      expect(mockKmsClient.send).toHaveBeenCalledWith(
        expect.any(VerifyCommand)
      );
    });

    it('should throw BadRequestError when keyId is missing', async () => {
      const signerWithoutDefaultKey = new KmsSigner(mockKmsClient);
      
      await expect(signerWithoutDefaultKey.verify({
        message: mockMessage,
        signature: mockSignature,
      } as any)).rejects.toThrow(BadRequestError);
    });

    it('should handle AWS errors', async () => {
      const awsError = new Error('AWS Error');
      mockKmsClient.send.mockRejectedValueOnce(awsError);

      await expect(kmsSigner.verify({
        message: mockMessage,
        signature: mockSignature,
      } as any)).rejects.toThrow(awsError);
    });
  });

  describe('retry logic', () => {
    it('should retry on retryable errors', async () => {
      const { shouldRetry, isAwsRetryable, sleep } = require('../../../src/index.js');
      
      // Mock retry logic to retry once then succeed
      shouldRetry
        .mockReturnValueOnce({ retry: true, delayMs: 100 })
        .mockReturnValueOnce({ retry: false, delayMs: 0 });
      
      isAwsRetryable.mockReturnValue(true);
      
      const awsError = new Error('ThrottlingException');
      mockKmsClient.send
        .mockRejectedValueOnce(awsError)
        .mockResolvedValueOnce({ CiphertextBlob: new Uint8Array([1, 2, 3]) });

      const result = await kmsSigner.encrypt({
        plaintext: new Uint8Array([1, 2, 3]),
      } as any);

      expect(result).toEqual({ ciphertext: new Uint8Array([1, 2, 3]) });
      expect(mockKmsClient.send).toHaveBeenCalledTimes(2);
      expect(sleep).toHaveBeenCalledWith(100);
    });

    it('should not retry on non-retryable errors', async () => {
      const { shouldRetry, isAwsRetryable } = require('../../../src/index.js');
      
      shouldRetry.mockReturnValue({ retry: false, delayMs: 0 });
      isAwsRetryable.mockReturnValue(false);
      
      const awsError = new Error('InvalidParameterException');
      mockKmsClient.send.mockRejectedValueOnce(awsError);

      await expect(kmsSigner.encrypt({
        plaintext: new Uint8Array([1, 2, 3]),
      } as any)).rejects.toThrow(awsError);
      
      expect(mockKmsClient.send).toHaveBeenCalledTimes(1);
    });
  });
});
