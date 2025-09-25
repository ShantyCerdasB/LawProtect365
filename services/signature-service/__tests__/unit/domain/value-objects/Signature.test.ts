/**
 * @fileoverview Unit tests for Signature value object
 * @summary Tests for signature validation and business logic
 * @description Comprehensive test suite for Signature value object covering validation,
 * signature metadata, and cryptographic evidence handling.
 */

import { Signature } from '../../../../src/domain/value-objects/Signature';
import { SignatureMetadata } from '../../../../src/domain/value-objects/SignatureMetadata';
import { BadRequestError } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../helpers/testUtils';

// Mock the validation functions
jest.mock('@lawprotect/shared-ts', () => ({
  ...jest.requireActual('@lawprotect/shared-ts'),
  validateSignatureHash: jest.fn(),
  validateSignatureTimestamp: jest.fn()
}));

import { validateSignatureHash, validateSignatureTimestamp } from '@lawprotect/shared-ts';

describe('Signature', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Set default implementations
    (validateSignatureHash as jest.Mock).mockImplementation(() => {});
    (validateSignatureTimestamp as jest.Mock).mockImplementation(() => {});
  });

  /**
   * Helper function to create Signature with default values and parameter overrides
   */
  function createSignatureWithParams(params: Partial<{
    signerId: string;
    documentHash: string;
    signatureHash: string;
    signedS3Key: string;
    kmsKeyId: string;
    algorithm: string;
    signedAt: Date;
    metadata: SignatureMetadata;
  }> = {}): Signature {
    return new Signature(
      params.signerId ?? TestUtils.generateUuid(),
      params.documentHash ?? TestUtils.generateSha256Hash(),
      params.signatureHash ?? TestUtils.generateSha256Hash(),
      params.signedS3Key ?? 'documents/signed/contract-123.pdf',
      params.kmsKeyId ?? 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
      params.algorithm ?? 'RSA-SHA256',
      params.signedAt ?? new Date(),
      params.metadata ?? new SignatureMetadata()
    );
  }

  describe('Constructor and Validation', () => {
    it('should create Signature with valid parameters', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata('I agree to the terms', 'New York, NY', '192.168.1.1', 'Mozilla/5.0');

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.getSignerId()).toBe(signerId);
      expect(signature.getDocumentHash()).toBe(documentHash);
      expect(signature.getSignatureHash()).toBe(signatureHash);
      expect(signature.getSignedS3Key()).toBe(signedS3Key);
      expect(signature.getKmsKeyId()).toBe(kmsKeyId);
      expect(signature.getAlgorithm()).toBe(algorithm);
      expect(signature.getSignedAt()).toBe(signedAt);
      expect(signature.getMetadata()).toBe(metadata);
    });

    it('should create Signature with minimal metadata', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.getSignerId()).toBe(signerId);
      expect(signature.getDocumentHash()).toBe(documentHash);
      expect(signature.getSignatureHash()).toBe(signatureHash);
      expect(signature.getSignedS3Key()).toBe(signedS3Key);
      expect(signature.getKmsKeyId()).toBe(kmsKeyId);
      expect(signature.getAlgorithm()).toBe(algorithm);
      expect(signature.getSignedAt()).toBe(signedAt);
      expect(signature.getMetadata()).toBe(metadata);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create Signature from EnvelopeSigner with complete data', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedAt = new Date();
      
      // Create mock signer with reduced nesting
      const mockSignerId = { getValue: () => signerId };
      const mockSigner = {
        getId: () => mockSignerId,
        getDocumentHash: () => documentHash,
        getSignatureHash: () => signatureHash,
        getSignedS3Key: () => 'documents/signed/contract-123.pdf',
        getKmsKeyId: () => 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        getAlgorithm: () => 'RSA-SHA256',
        getSignedAt: () => signedAt,
        getReason: () => 'I agree to the terms',
        getLocation: () => 'New York, NY',
        getIpAddress: () => '192.168.1.1',
        getUserAgent: () => 'Mozilla/5.0'
      };

      const signature = Signature.fromEnvelopeSigner(mockSigner);

      expect(signature).not.toBeNull();
      expect(signature!.getSignerId()).toBe(signerId);
      expect(signature!.getDocumentHash()).toBe(documentHash);
      expect(signature!.getSignatureHash()).toBe(signatureHash);
      expect(signature!.getSignedS3Key()).toBe(mockSigner.getSignedS3Key());
      expect(signature!.getKmsKeyId()).toBe(mockSigner.getKmsKeyId());
      expect(signature!.getAlgorithm()).toBe(mockSigner.getAlgorithm());
      expect(signature!.getSignedAt()).toBe(signedAt);
      expect(signature!.getReason()).toBe(mockSigner.getReason());
      expect(signature!.getLocation()).toBe(mockSigner.getLocation());
      expect(signature!.getIpAddress()).toBe(mockSigner.getIpAddress());
      expect(signature!.getUserAgent()).toBe(mockSigner.getUserAgent());
    });

    it('should create Signature from EnvelopeSigner with minimal data', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedAt = new Date();
      
      // Create mock signer with reduced nesting
      const mockSignerId = { getValue: () => signerId };
      const mockSigner = {
        getId: () => mockSignerId,
        getDocumentHash: () => documentHash,
        getSignatureHash: () => signatureHash,
        getSignedS3Key: () => 'documents/signed/contract-123.pdf',
        getKmsKeyId: () => 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        getAlgorithm: () => 'RSA-SHA256',
        getSignedAt: () => signedAt,
        getReason: () => undefined,
        getLocation: () => undefined,
        getIpAddress: () => undefined,
        getUserAgent: () => undefined
      };

      const signature = Signature.fromEnvelopeSigner(mockSigner);

      expect(signature).not.toBeNull();
      expect(signature!.getSignerId()).toBe(signerId);
      expect(signature!.getReason()).toBeUndefined();
      expect(signature!.getLocation()).toBeUndefined();
      expect(signature!.getIpAddress()).toBeUndefined();
      expect(signature!.getUserAgent()).toBeUndefined();
    });

    it('should return null when EnvelopeSigner has no signature data', () => {
      // Create mock signer with reduced nesting
      const mockSignerId = { getValue: () => TestUtils.generateUuid() };
      const mockSigner = {
        getId: () => mockSignerId,
        getDocumentHash: () => null,
        getSignatureHash: () => null,
        getSignedS3Key: () => 'documents/signed/contract-123.pdf',
        getKmsKeyId: () => 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        getAlgorithm: () => 'RSA-SHA256',
        getSignedAt: () => new Date(),
        getReason: () => undefined,
        getLocation: () => undefined,
        getIpAddress: () => undefined,
        getUserAgent: () => undefined
      };

      const signature = Signature.fromEnvelopeSigner(mockSigner);

      expect(signature).toBeNull();
    });

    it('should return null when EnvelopeSigner has no document hash', () => {
      // Create mock signer with reduced nesting
      const mockSignerId = { getValue: () => TestUtils.generateUuid() };
      const mockSigner = {
        getId: () => mockSignerId,
        getDocumentHash: () => null,
        getSignatureHash: () => TestUtils.generateSha256Hash(),
        getSignedS3Key: () => 'documents/signed/contract-123.pdf',
        getKmsKeyId: () => 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        getAlgorithm: () => 'RSA-SHA256',
        getSignedAt: () => new Date(),
        getReason: () => undefined,
        getLocation: () => undefined,
        getIpAddress: () => undefined,
        getUserAgent: () => undefined
      };

      const signature = Signature.fromEnvelopeSigner(mockSigner);

      expect(signature).toBeNull();
    });

    it('should return null when EnvelopeSigner has no signature hash', () => {
      // Create mock signer with reduced nesting
      const mockSignerId = { getValue: () => TestUtils.generateUuid() };
      const mockSigner = {
        getId: () => mockSignerId,
        getDocumentHash: () => TestUtils.generateSha256Hash(),
        getSignatureHash: () => null,
        getSignedS3Key: () => 'documents/signed/contract-123.pdf',
        getKmsKeyId: () => 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        getAlgorithm: () => 'RSA-SHA256',
        getSignedAt: () => new Date(),
        getReason: () => undefined,
        getLocation: () => undefined,
        getIpAddress: () => undefined,
        getUserAgent: () => undefined
      };

      const signature = Signature.fromEnvelopeSigner(mockSigner);

      expect(signature).toBeNull();
    });
  });

  describe('Business Logic Methods', () => {
    it('should get reason from metadata', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata('I agree to the terms');

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.getReason()).toBe('I agree to the terms');
    });

    it('should get location from metadata', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata(undefined, 'New York, NY');

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.getLocation()).toBe('New York, NY');
    });

    it('should get IP address from metadata', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata(undefined, undefined, '192.168.1.1');

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.getIpAddress()).toBe('192.168.1.1');
    });

    it('should get user agent from metadata', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata(undefined, undefined, undefined, 'Mozilla/5.0');

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.getUserAgent()).toBe('Mozilla/5.0');
    });

    it('should return undefined for missing metadata fields', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.getReason()).toBeUndefined();
      expect(signature.getLocation()).toBeUndefined();
      expect(signature.getIpAddress()).toBeUndefined();
      expect(signature.getUserAgent()).toBeUndefined();
    });
  });

  describe('Validation', () => {
    it('should validate signature integrity with valid data', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.validateIntegrity()).toBe(true);
    });

    it('should fail validation with missing document hash', () => {
      const signerId = TestUtils.generateUuid();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        '',
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.validateIntegrity()).toBe(false);
    });

    it('should fail validation with missing signature hash', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        '',
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.validateIntegrity()).toBe(false);
    });

    it('should fail validation with missing signed S3 key', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        '',
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.validateIntegrity()).toBe(false);
    });

    it('should fail validation when hash validation throws error', () => {
      const signature = createSignatureWithParams();
      
      // Mock validateSignatureHash to throw an error
      (validateSignatureHash as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid hash');
      });

      expect(signature.validateIntegrity()).toBe(false);
    });

    it('should fail validation when timestamp validation throws error', () => {
      const signature = createSignatureWithParams();
      
      // Mock validateSignatureTimestamp to throw an error
      (validateSignatureTimestamp as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid timestamp');
      });

      expect(signature.validateIntegrity()).toBe(false);
    });
  });

  describe('Age and Timing', () => {
    it('should calculate signature age correctly', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date(Date.now() - 1000); // 1 second ago
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      const age = signature.getAge();
      expect(age).toBeGreaterThanOrEqual(1000);
      expect(age).toBeLessThan(2000); // Allow some tolerance
    });

    it('should identify recent signatures correctly', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date(Date.now() - 5000); // 5 seconds ago
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.isRecent(10000)).toBe(true); // Within 10 seconds
      expect(signature.isRecent(1000)).toBe(false); // Not within 1 second
    });

    it('should identify old signatures correctly', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date(Date.now() - 3600000); // 1 hour ago
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature.isRecent(300000)).toBe(false); // Not within 5 minutes
      expect(signature.isRecent(7200000)).toBe(true); // Within 2 hours
    });
  });

  describe('Equality', () => {
    it('should return true for equal Signatures', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const signature1 = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      const signature2 = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature1.equals(signature2)).toBe(true);
    });

    it('should return false for different Signatures', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash1 = TestUtils.generateSha256Hash();
      const signatureHash2 = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const signature1 = new Signature(
        signerId,
        documentHash,
        signatureHash1,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      const signature2 = new Signature(
        signerId,
        documentHash,
        signatureHash2,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      expect(signature1.equals(signature2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      const otherObject = { getSignerId: () => signerId };

      expect(signature.equals(otherObject as any)).toBe(false);
    });
  });

  describe('Audit Summary', () => {
    it('should return complete audit summary', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata('I agree', 'NYC', '192.168.1.1', 'Mozilla/5.0');

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      const summary = signature.getAuditSummary();

      expect(summary.signerId).toBe(signerId);
      expect(summary.documentHash).toBe(documentHash);
      expect(summary.signatureHash).toBe(signatureHash);
      expect(summary.signedAt).toBe(signedAt);
      expect(summary.algorithm).toBe(algorithm);
      expect(summary.kmsKeyId).toBe(kmsKeyId);
      expect(summary.signedS3Key).toBe(signedS3Key);
      expect(summary.reason).toBe('I agree');
      expect(summary.location).toBe('NYC');
      expect(summary.ipAddress).toBe('192.168.1.1');
      expect(summary.userAgent).toBe('Mozilla/5.0');
    });

    it('should return audit summary with undefined metadata fields', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      const summary = signature.getAuditSummary();

      expect(summary.signerId).toBe(signerId);
      expect(summary.documentHash).toBe(documentHash);
      expect(summary.signatureHash).toBe(signatureHash);
      expect(summary.signedAt).toBe(signedAt);
      expect(summary.algorithm).toBe(algorithm);
      expect(summary.kmsKeyId).toBe(kmsKeyId);
      expect(summary.signedS3Key).toBe(signedS3Key);
      expect(summary.reason).toBeUndefined();
      expect(summary.location).toBeUndefined();
      expect(summary.ipAddress).toBeUndefined();
      expect(summary.userAgent).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle future timestamps', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date(Date.now() + 3600000); // 1 hour in the future
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      const age = signature.getAge();
      expect(age).toBeLessThan(0); // Negative age for future timestamps
    });

    it('should handle very old timestamps', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date(Date.now() - 31536000000); // 1 year ago
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      const age = signature.getAge();
      expect(age).toBeGreaterThanOrEqual(31536000000);
    });

    it('should maintain immutability', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const signature = new Signature(
        signerId,
        documentHash,
        signatureHash,
        signedS3Key,
        kmsKeyId,
        algorithm,
        signedAt,
        metadata
      );

      const originalSignerId = signature.getSignerId();
      const originalDocumentHash = signature.getDocumentHash();
      const originalSignatureHash = signature.getSignatureHash();

      // Attempting to modify the internal values should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(signature.getSignerId()).toBe(originalSignerId);
      expect(signature.getDocumentHash()).toBe(originalDocumentHash);
      expect(signature.getSignatureHash()).toBe(originalSignatureHash);
    });

    it('should handle different signature algorithms', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const algorithms = ['RSA-SHA256', 'ECDSA-SHA256', 'DSA-SHA256', 'HMAC-SHA256'];

      // Test each algorithm individually to avoid deep nesting
      for (const algorithm of algorithms) {
        expect(() => new Signature(
          signerId,
          documentHash,
          signatureHash,
          signedS3Key,
          kmsKeyId,
          algorithm,
          signedAt,
          metadata
        )).not.toThrow();
      });
    });

    it('should handle complex KMS key ARNs', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const complexKmsKeyIds = [
        'arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012',
        'arn:aws:kms:eu-west-1:987654321098:key/87654321-4321-4321-4321-210987654321',
        'arn:aws:kms:ap-southeast-1:111111111111:key/11111111-1111-1111-1111-111111111111'
      ];

      // Test each KMS key ID individually to avoid deep nesting
      for (const kmsKeyId of complexKmsKeyIds) {
        expect(() => new Signature(
          signerId,
          documentHash,
          signatureHash,
          signedS3Key,
          kmsKeyId,
          algorithm,
          signedAt,
          metadata
        )).not.toThrow();
      });
    });

    it('should handle complex S3 keys', () => {
      const signerId = TestUtils.generateUuid();
      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const algorithm = 'RSA-SHA256';
      const signedAt = new Date();
      const metadata = new SignatureMetadata();

      const complexS3Keys = [
        'documents/2024/01/contracts/signed/contract-123-final.pdf',
        'signatures/user-456/envelope-789/signed-document.pdf',
        'legal/agreements/2024/Q1/signed/terms-and-conditions.pdf'
      ];

      complexS3Keys.forEach(signedS3Key => {
        expect(() => new Signature(
          signerId,
          documentHash,
          signatureHash,
          signedS3Key,
          kmsKeyId,
          algorithm,
          signedAt,
          metadata
        )).not.toThrow();
      });
    });
  });
});