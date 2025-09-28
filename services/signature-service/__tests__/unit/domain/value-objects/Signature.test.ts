/**
 * @fileoverview Signature unit tests
 * @summary Tests for Signature value object
 * @description Comprehensive unit tests for Signature class methods
 */

import { Signature } from '../../../../src/domain/value-objects/Signature';
import { SignatureMetadata } from '../../../../src/domain/value-objects/SignatureMetadata';
import { TestUtils } from '../../../helpers/testUtils';

describe('Signature', () => {
  describe('Constructor and Validation', () => {
    it('should create a Signature with valid parameters', () => {
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

      expect(signature).toBeInstanceOf(Signature);
      expect(signature.getSignerId()).toBe(signerId);
      expect(signature.getDocumentHash()).toBe(documentHash);
      expect(signature.getSignatureHash()).toBe(signatureHash);
      expect(signature.getSignedS3Key()).toBe(signedS3Key);
      expect(signature.getKmsKeyId()).toBe(kmsKeyId);
      expect(signature.getAlgorithm()).toBe(algorithm);
      expect(signature.getSignedAt()).toBe(signedAt);
      expect(signature.getMetadata()).toBe(metadata);
    });

    it('should throw error for invalid signer ID', () => {
      expect(() => new Signature(
        '',
        TestUtils.generateSha256Hash(),
        TestUtils.generateSha256Hash(),
        'documents/signed/contract-123.pdf',
        'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        'RSA-SHA256',
        new Date(),
        new SignatureMetadata()
      )).toThrow();
    });

    it('should throw error for invalid document hash', () => {
      expect(() => new Signature(
        TestUtils.generateUuid(),
        '',
        TestUtils.generateSha256Hash(),
        'documents/signed/contract-123.pdf',
        'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        'RSA-SHA256',
        new Date(),
        new SignatureMetadata()
      )).toThrow();
    });

    it('should throw error for invalid signature hash', () => {
      expect(() => new Signature(
        TestUtils.generateUuid(),
        TestUtils.generateSha256Hash(),
        '',
        'documents/signed/contract-123.pdf',
        'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        'RSA-SHA256',
        new Date(),
        new SignatureMetadata()
      )).toThrow();
    });

    it('should throw error for invalid S3 key', () => {
      expect(() => new Signature(
        TestUtils.generateUuid(),
        TestUtils.generateSha256Hash(),
        TestUtils.generateSha256Hash(),
        '',
        'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        'RSA-SHA256',
        new Date(),
        new SignatureMetadata()
      )).toThrow();
    });

    it('should throw error for invalid KMS key ID', () => {
      expect(() => new Signature(
        TestUtils.generateUuid(),
        TestUtils.generateSha256Hash(),
        TestUtils.generateSha256Hash(),
        'documents/signed/contract-123.pdf',
        '',
        'RSA-SHA256',
        new Date(),
        new SignatureMetadata()
      )).toThrow();
    });

    it('should throw error for invalid algorithm', () => {
      expect(() => new Signature(
        TestUtils.generateUuid(),
        TestUtils.generateSha256Hash(),
        TestUtils.generateSha256Hash(),
        'documents/signed/contract-123.pdf',
        'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        '',
        new Date(),
        new SignatureMetadata()
      )).toThrow();
    });

    it('should throw error for invalid signed date', () => {
      expect(() => new Signature(
        TestUtils.generateUuid(),
        TestUtils.generateSha256Hash(),
        TestUtils.generateSha256Hash(),
        'documents/signed/contract-123.pdf',
        'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        'RSA-SHA256',
        null as any,
        new SignatureMetadata()
      )).toThrow();
    });

    it('should throw error for invalid metadata', () => {
      expect(() => new Signature(
        TestUtils.generateUuid(),
        TestUtils.generateSha256Hash(),
        TestUtils.generateSha256Hash(),
        'documents/signed/contract-123.pdf',
        'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
        'RSA-SHA256',
        new Date(),
        null as any
      )).toThrow();
    });
  });

  describe('Getters', () => {
    it('should return correct signer ID', () => {
      const signerId = TestUtils.generateUuid();
      const signature = createSignature({ signerId });
      expect(signature.getSignerId()).toBe(signerId);
    });

    it('should return correct document hash', () => {
      const documentHash = TestUtils.generateSha256Hash();
      const signature = createSignature({ documentHash });
      expect(signature.getDocumentHash()).toBe(documentHash);
    });

    it('should return correct signature hash', () => {
      const signatureHash = TestUtils.generateSha256Hash();
      const signature = createSignature({ signatureHash });
      expect(signature.getSignatureHash()).toBe(signatureHash);
    });

    it('should return correct signed S3 key', () => {
      const signedS3Key = 'documents/signed/contract-123.pdf';
      const signature = createSignature({ signedS3Key });
      expect(signature.getSignedS3Key()).toBe(signedS3Key);
    });

    it('should return correct KMS key ID', () => {
      const kmsKeyId = 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
      const signature = createSignature({ kmsKeyId });
      expect(signature.getKmsKeyId()).toBe(kmsKeyId);
    });

    it('should return correct algorithm', () => {
      const algorithm = 'RSA-SHA256';
      const signature = createSignature({ algorithm });
      expect(signature.getAlgorithm()).toBe(algorithm);
    });

    it('should return correct signed date', () => {
      const signedAt = new Date();
      const signature = createSignature({ signedAt });
      expect(signature.getSignedAt()).toBe(signedAt);
    });

    it('should return correct metadata', () => {
      const metadata = new SignatureMetadata();
      const signature = createSignature({ metadata });
      expect(signature.getMetadata()).toBe(metadata);
    });
  });

  describe('Equality', () => {
    it('should return true for equal signatures', () => {
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

    it('should return false for different signatures', () => {
      const signature1 = createSignature({ signerId: TestUtils.generateUuid() });
      const signature2 = createSignature({ signerId: TestUtils.generateUuid() });

      expect(signature1.equals(signature2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const signature = createSignature();
      expect(signature.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      const signature = createSignature();
      expect(signature.equals(undefined as any)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should return correct string representation', () => {
      const signature = createSignature();
      const stringRep = signature.toString();
      expect(stringRep).toContain(signature.getSignerId());
      expect(stringRep).toContain(signature.getDocumentHash());
      expect(stringRep).toContain(signature.getSignatureHash());
    });

    it('should return correct JSON representation', () => {
      const signature = createSignature();
      const jsonRep = signature.toJSON();
      expect(jsonRep).toHaveProperty('signerId');
      expect(jsonRep).toHaveProperty('documentHash');
      expect(jsonRep).toHaveProperty('signatureHash');
      expect(jsonRep).toHaveProperty('signedS3Key');
      expect(jsonRep).toHaveProperty('kmsKeyId');
      expect(jsonRep).toHaveProperty('algorithm');
      expect(jsonRep).toHaveProperty('signedAt');
      expect(jsonRep).toHaveProperty('metadata');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long S3 keys', () => {
      const longS3Key = 'documents/2024/01/contracts/signed/very-long-contract-name-with-many-words-and-descriptions-final-version.pdf';
      const signature = createSignature({ signedS3Key: longS3Key });
      expect(signature.getSignedS3Key()).toBe(longS3Key);
    });

    it('should handle complex KMS key ARNs', () => {
      const complexKmsKeyId = 'arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012';
      const signature = createSignature({ kmsKeyId: complexKmsKeyId });
      expect(signature.getKmsKeyId()).toBe(complexKmsKeyId);
    });

    it('should handle different algorithms', () => {
      const algorithms = ['RSA-SHA256', 'RSA-SHA384', 'RSA-SHA512', 'ECDSA-SHA256', 'ECDSA-SHA384'];
      
      algorithms.forEach(algorithm => {
        const signature = createSignature({ algorithm });
        expect(signature.getAlgorithm()).toBe(algorithm);
      });
    });

    it('should handle future dates', () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day in the future
      const signature = createSignature({ signedAt: futureDate });
      expect(signature.getSignedAt()).toBe(futureDate);
    });

    it('should handle past dates', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 day in the past
      const signature = createSignature({ signedAt: pastDate });
      expect(signature.getSignedAt()).toBe(pastDate);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple signatures with same parameters', () => {
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

    it('should handle different metadata objects', () => {
      const metadata1 = new SignatureMetadata();
      const metadata2 = new SignatureMetadata();
      
      // Use fixed values to ensure signatures are equal except for metadata
      const fixedSignerId = 'fixed-signer-id';
      const fixedDocumentHash = 'fixed-document-hash';
      const fixedSignatureHash = 'fixed-signature-hash';
      const fixedSignedS3Key = 'fixed-s3-key';
      const fixedKmsKeyId = 'fixed-kms-key-id';
      const fixedAlgorithm = 'fixed-algorithm';
      const fixedSignedAt = new Date('2024-01-01T00:00:00Z');
      
      const signature1 = createSignature({ 
        signerId: fixedSignerId,
        documentHash: fixedDocumentHash,
        signatureHash: fixedSignatureHash,
        signedS3Key: fixedSignedS3Key,
        kmsKeyId: fixedKmsKeyId,
        algorithm: fixedAlgorithm,
        signedAt: fixedSignedAt,
        metadata: metadata1 
      });
      const signature2 = createSignature({ 
        signerId: fixedSignerId,
        documentHash: fixedDocumentHash,
        signatureHash: fixedSignatureHash,
        signedS3Key: fixedSignedS3Key,
        kmsKeyId: fixedKmsKeyId,
        algorithm: fixedAlgorithm,
        signedAt: fixedSignedAt,
        metadata: metadata2 
      });

      // Even with different metadata objects, signatures should be equal if other parameters are the same
      expect(signature1.equals(signature2)).toBe(true);
    });

    it('should handle complex S3 keys', () => {
      const complexS3Keys = [
        'documents/2024/01/contracts/signed/contract-123-final.pdf',
        'signatures/user-456/envelope-789/signed-document.pdf',
        'legal/agreements/2024/Q1/signed/terms-and-conditions.pdf'
      ];

      complexS3Keys.forEach(signedS3Key => {
        const signature = createSignature({ signedS3Key });
        expect(signature.getSignedS3Key()).toBe(signedS3Key);
      });
    });

    it('should handle complex KMS key ARNs', () => {
      const complexKmsKeyIds = [
        'arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012',
        'arn:aws:kms:eu-west-1:987654321098:key/87654321-4321-4321-4321-210987654321',
        'arn:aws:kms:ap-southeast-1:111111111111:key/11111111-1111-1111-1111-111111111111'
      ];

      // Test each KMS key ID individually to avoid deep nesting
      for (const kmsKeyId of complexKmsKeyIds) {
        expect(() => new Signature(
          TestUtils.generateUuid(),
          TestUtils.generateSha256Hash(),
          TestUtils.generateSha256Hash(),
          'documents/signed/contract-123.pdf',
          kmsKeyId,
          'RSA-SHA256',
          new Date(),
          new SignatureMetadata()
        )).not.toThrow();
      }
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

  describe('Metadata Access Methods', () => {
    it('should get reason from metadata', () => {
      const metadata = new SignatureMetadata('Legal compliance');
      const signature = createSignature({ metadata });
      
      expect(signature.getReason()).toBe('Legal compliance');
    });

    it('should get location from metadata', () => {
      const metadata = new SignatureMetadata(undefined, 'New York, NY');
      const signature = createSignature({ metadata });
      
      expect(signature.getLocation()).toBe('New York, NY');
    });

    it('should get IP address from metadata', () => {
      const metadata = new SignatureMetadata(undefined, undefined, '192.168.1.1');
      const signature = createSignature({ metadata });
      
      expect(signature.getIpAddress()).toBe('192.168.1.1');
    });

    it('should get user agent from metadata', () => {
      const metadata = new SignatureMetadata(undefined, undefined, undefined, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      const signature = createSignature({ metadata });
      
      expect(signature.getUserAgent()).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    });

    it('should return undefined for missing metadata values', () => {
      const metadata = new SignatureMetadata();
      const signature = createSignature({ metadata });
      
      expect(signature.getReason()).toBeUndefined();
      expect(signature.getLocation()).toBeUndefined();
      expect(signature.getIpAddress()).toBeUndefined();
      expect(signature.getUserAgent()).toBeUndefined();
    });
  });

  describe('Static Factory Methods', () => {
    it('should create Signature from EnvelopeSigner with valid data', () => {
      const mockSigner = {
        getId: () => ({ getValue: () => 'test-signer-id' }),
        getDocumentHash: () => 'test-document-hash',
        getSignatureHash: () => 'test-signature-hash',
        getSignedS3Key: () => 'test-s3-key',
        getKmsKeyId: () => 'test-kms-key',
        getAlgorithm: () => 'RSA-SHA256',
        getSignedAt: () => new Date('2024-01-01T00:00:00Z'),
        getReason: () => 'test-reason',
        getLocation: () => 'test-location',
        getIpAddress: () => '192.168.1.1',
        getUserAgent: () => 'test-user-agent'
      };

      const signature = Signature.fromEnvelopeSigner(mockSigner);
      
      expect(signature).toBeInstanceOf(Signature);
      expect(signature?.getSignerId()).toBe('test-signer-id');
      expect(signature?.getDocumentHash()).toBe('test-document-hash');
      expect(signature?.getSignatureHash()).toBe('test-signature-hash');
    });

    it('should return null when EnvelopeSigner has no document hash', () => {
      const mockSigner = {
        getId: () => ({ getValue: () => 'test-signer-id' }),
        getDocumentHash: () => null,
        getSignatureHash: () => 'test-signature-hash',
        getSignedS3Key: () => 'test-s3-key',
        getKmsKeyId: () => 'test-kms-key',
        getAlgorithm: () => 'RSA-SHA256',
        getSignedAt: () => new Date('2024-01-01T00:00:00Z')
      };

      const signature = Signature.fromEnvelopeSigner(mockSigner);
      expect(signature).toBeNull();
    });

    it('should return null when EnvelopeSigner has no signature hash', () => {
      const mockSigner = {
        getId: () => ({ getValue: () => 'test-signer-id' }),
        getDocumentHash: () => 'test-document-hash',
        getSignatureHash: () => null,
        getSignedS3Key: () => 'test-s3-key',
        getKmsKeyId: () => 'test-kms-key',
        getAlgorithm: () => 'RSA-SHA256',
        getSignedAt: () => new Date('2024-01-01T00:00:00Z')
      };

      const signature = Signature.fromEnvelopeSigner(mockSigner);
      expect(signature).toBeNull();
    });
  });

  describe('Validation and Utility Methods', () => {
    it('should validate signature integrity successfully', () => {
      const signature = createSignature();
      expect(signature.validateIntegrity()).toBe(true);
    });

    it('should return false for invalid integrity when validation fails', () => {
      // Test with invalid hash format that will fail validation
      const signature = createSignature({
        documentHash: 'invalid-hash-format',
        signatureHash: 'invalid-hash-format'
      });
      expect(signature.validateIntegrity()).toBe(false);
    });


    it('should get signature age in milliseconds', () => {
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      const signature = createSignature({ signedAt: pastDate });
      
      const age = signature.getAge();
      expect(age).toBeGreaterThanOrEqual(1000);
      expect(age).toBeLessThan(2000); // Allow some tolerance
    });

    it('should check if signature is recent', () => {
      const recentDate = new Date(Date.now() - 5000); // 5 seconds ago
      const signature = createSignature({ signedAt: recentDate });
      
      expect(signature.isRecent(10000)).toBe(true); // Within 10 seconds
      expect(signature.isRecent(1000)).toBe(false); // Not within 1 second
    });

    it('should check if signature is not recent', () => {
      const oldDate = new Date(Date.now() - 60000); // 1 minute ago
      const signature = createSignature({ signedAt: oldDate });
      
      expect(signature.isRecent(30000)).toBe(false); // Not within 30 seconds
      expect(signature.isRecent(120000)).toBe(true); // Within 2 minutes
    });
  });
});

// Helper function to create Signature instances with optional overrides
function createSignature(params: {
  signerId?: string;
  documentHash?: string;
  signatureHash?: string;
  signedS3Key?: string;
  kmsKeyId?: string;
  algorithm?: string;
  signedAt?: Date;
  metadata?: SignatureMetadata;
} = {}): Signature {
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