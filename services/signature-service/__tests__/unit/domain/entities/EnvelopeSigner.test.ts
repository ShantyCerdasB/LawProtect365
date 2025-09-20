/**
 * @fileoverview EnvelopeSigner Entity Unit Tests
 * @summary Comprehensive test suite for EnvelopeSigner entity with 100% coverage
 * @description Tests all business logic, state transitions, validations, and edge cases
 * for the EnvelopeSigner entity that consolidates signer and signature data.
 */

import { EnvelopeSigner } from '../../../../src/domain/entities/EnvelopeSigner';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { Email } from '../../../../src/domain/value-objects/Email';
import { SignatureMetadata } from '../../../../src/domain/value-objects/SignatureMetadata';
import { SignerStatus } from '@prisma/client';
import { TestUtils } from '../../../helpers/testUtils';
import { 
  invalidSignerState, 
  signerAlreadySigned,
  signerAlreadyDeclined,
  consentTextRequired
} from '../../../../src/signature-errors';

describe('EnvelopeSigner', () => {
  // Helper function to create EnvelopeSigner with custom parameters
  function createEnvelopeSignerWithParams(params: {
    id?: string;
    envelopeId?: string;
    userId?: string;
    isExternal?: boolean;
    email?: string;
    fullName?: string;
    invitedByUserId?: string;
    participantRole?: string;
    order?: number;
    status?: SignerStatus;
    signedAt?: Date;
    declinedAt?: Date;
    declineReason?: string;
    consentGiven?: boolean;
    consentTimestamp?: Date;
    documentHash?: string;
    signatureHash?: string;
    signedS3Key?: string;
    kmsKeyId?: string;
    algorithm?: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
    location?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): EnvelopeSigner {
    return new EnvelopeSigner(
      new SignerId(params.id || TestUtils.generateUuid()),
      new EnvelopeId(params.envelopeId || TestUtils.generateUuid()),
      params.userId,
      params.isExternal ?? false,
      params.email ? new Email(params.email) : undefined,
      params.fullName,
      params.invitedByUserId,
      params.participantRole || 'SIGNER',
      params.order || 1,
      params.status || SignerStatus.PENDING,
      params.signedAt,
      params.declinedAt,
      params.declineReason,
      params.consentGiven,
      params.consentTimestamp,
      params.documentHash,
      params.signatureHash,
      params.signedS3Key,
      params.kmsKeyId,
      params.algorithm,
      params.ipAddress,
      params.userAgent,
      params.reason,
      params.location,
      params.createdAt || new Date('2024-01-01'),
      params.updatedAt || new Date('2024-01-01')
    );
  }

  describe('Constructor and Getters', () => {
    it('should create signer with all properties', () => {
      const signerId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const email = 'test@example.com';
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const signer = createEnvelopeSignerWithParams({
        id: signerId,
        envelopeId: envelopeId,
        userId: 'user-123',
        isExternal: false,
        email: email,
        fullName: 'John Doe',
        invitedByUserId: 'inviter-456',
        participantRole: 'WITNESS',
        order: 2,
        status: SignerStatus.SIGNED,
        signedAt: new Date('2024-01-02'),
        consentGiven: true,
        consentTimestamp: new Date('2024-01-01'),
        documentHash: TestUtils.generateSha256Hash(),
        signatureHash: TestUtils.generateSha256Hash(),
        signedS3Key: 'signed-document.pdf',
        kmsKeyId: 'kms-key-123',
        algorithm: 'RSA-SHA256',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        reason: 'Legal compliance',
        location: 'New York, NY',
        createdAt: createdAt,
        updatedAt: updatedAt
      });

      expect(signer.getId().getValue()).toBe(signerId);
      expect(signer.getEnvelopeId().getValue()).toBe(envelopeId);
      expect(signer.getUserId()).toBe('user-123');
      expect(signer.getIsExternal()).toBe(false);
      expect(signer.getEmail()?.getValue()).toBe(email);
      expect(signer.getFullName()).toBe('John Doe');
      expect(signer.getInvitedByUserId()).toBe('inviter-456');
      expect(signer.getParticipantRole()).toBe('WITNESS');
      expect(signer.getOrder()).toBe(2);
      expect(signer.getStatus()).toBe(SignerStatus.SIGNED);
      expect(signer.getSignedAt()).toEqual(new Date('2024-01-02'));
      expect(signer.getConsentGiven()).toBe(true);
      expect(signer.getConsentTimestamp()).toEqual(new Date('2024-01-01'));
      expect(signer.getDocumentHash()).toBeDefined();
      expect(signer.getSignatureHash()).toBeDefined();
      expect(signer.getSignedS3Key()).toBe('signed-document.pdf');
      expect(signer.getKmsKeyId()).toBe('kms-key-123');
      expect(signer.getAlgorithm()).toBe('RSA-SHA256');
      expect(signer.getIpAddress()).toBe('192.168.1.1');
      expect(signer.getUserAgent()).toBe('Mozilla/5.0');
      expect(signer.getReason()).toBe('Legal compliance');
      expect(signer.getLocation()).toBe('New York, NY');
      expect(signer.getCreatedAt()).toEqual(createdAt);
      expect(signer.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should create external signer with minimal properties', () => {
      const signer = createEnvelopeSignerWithParams({
        isExternal: true,
        email: 'external@example.com',
        fullName: 'External User',
        status: SignerStatus.PENDING
      });

      expect(signer.getIsExternal()).toBe(true);
      expect(signer.getEmail()?.getValue()).toBe('external@example.com');
      expect(signer.getFullName()).toBe('External User');
      expect(signer.getUserId()).toBeUndefined();
      expect(signer.getStatus()).toBe(SignerStatus.PENDING);
      expect(signer.getSignedAt()).toBeUndefined();
      expect(signer.getDeclinedAt()).toBeUndefined();
    });

    it('should handle undefined optional fields', () => {
      const signer = createEnvelopeSignerWithParams({
        userId: undefined,
        email: undefined,
        fullName: undefined,
        invitedByUserId: undefined,
        signedAt: undefined,
        declinedAt: undefined,
        declineReason: undefined,
        consentGiven: undefined,
        consentTimestamp: undefined,
        documentHash: undefined,
        signatureHash: undefined,
        signedS3Key: undefined,
        kmsKeyId: undefined,
        algorithm: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        reason: undefined,
        location: undefined
      });

      expect(signer.getUserId()).toBeUndefined();
      expect(signer.getEmail()).toBeUndefined();
      expect(signer.getFullName()).toBeUndefined();
      expect(signer.getInvitedByUserId()).toBeUndefined();
      expect(signer.getSignedAt()).toBeUndefined();
      expect(signer.getDeclinedAt()).toBeUndefined();
      expect(signer.getDeclineReason()).toBeUndefined();
      expect(signer.getConsentGiven()).toBeUndefined();
      expect(signer.getConsentTimestamp()).toBeUndefined();
      expect(signer.getDocumentHash()).toBeUndefined();
      expect(signer.getSignatureHash()).toBeUndefined();
      expect(signer.getSignedS3Key()).toBeUndefined();
      expect(signer.getKmsKeyId()).toBeUndefined();
      expect(signer.getAlgorithm()).toBeUndefined();
      expect(signer.getIpAddress()).toBeUndefined();
      expect(signer.getUserAgent()).toBeUndefined();
      expect(signer.getReason()).toBeUndefined();
      expect(signer.getLocation()).toBeUndefined();
    });
  });

  describe('Status Management', () => {
    it('should update status from PENDING to SIGNED', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.PENDING
      });

      signer.updateStatus(SignerStatus.SIGNED);

      expect(signer.getStatus()).toBe(SignerStatus.SIGNED);
    });

    it('should update status from PENDING to DECLINED', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.PENDING
      });

      signer.updateStatus(SignerStatus.DECLINED);

      expect(signer.getStatus()).toBe(SignerStatus.DECLINED);
    });

    it('should throw error when trying to decline after signing', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.SIGNED
      });

      expect(() => signer.updateStatus(SignerStatus.DECLINED))
        .toThrow(invalidSignerState('Cannot decline after signing'));
    });

    it('should throw error when trying to sign after declining', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.DECLINED
      });

      expect(() => signer.updateStatus(SignerStatus.SIGNED))
        .toThrow(invalidSignerState('Cannot sign after declining'));
    });
  });

  describe('Signing Process', () => {
    it('should sign successfully with all required data', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.PENDING
      });

      const documentHash = TestUtils.generateSha256Hash();
      const signatureHash = TestUtils.generateSha256Hash();
      const signedS3Key = 'signed-document.pdf';
      const kmsKeyId = 'kms-key-123';
      const algorithm = 'RSA-SHA256';
      const metadata = SignatureMetadata.fromObject({
        reason: 'Legal compliance',
        location: 'New York, NY',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });

      signer.sign(documentHash, signatureHash, signedS3Key, kmsKeyId, algorithm, metadata);

      expect(signer.getStatus()).toBe(SignerStatus.SIGNED);
      expect(signer.getSignedAt()).toBeDefined();
      expect(signer.getDocumentHash()).toBe(documentHash);
      expect(signer.getSignatureHash()).toBe(signatureHash);
      expect(signer.getSignedS3Key()).toBe(signedS3Key);
      expect(signer.getKmsKeyId()).toBe(kmsKeyId);
      expect(signer.getAlgorithm()).toBe(algorithm);
      expect(signer.getReason()).toBe('Legal compliance');
      expect(signer.getLocation()).toBe('New York, NY');
      expect(signer.getIpAddress()).toBe('192.168.1.1');
      expect(signer.getUserAgent()).toBe('Mozilla/5.0');
    });

    it('should throw error when trying to sign already signed signer', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.SIGNED
      });

      const metadata = SignatureMetadata.fromObject({});

      expect(() => signer.sign(
        TestUtils.generateSha256Hash(),
        TestUtils.generateSha256Hash(),
        'signed-document.pdf',
        'kms-key-123',
        'RSA-SHA256',
        metadata
      )).toThrow(signerAlreadySigned('Signer has already signed'));
    });

    it('should throw error when trying to sign already declined signer', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.DECLINED
      });

      const metadata = SignatureMetadata.fromObject({});

      expect(() => signer.sign(
        TestUtils.generateSha256Hash(),
        TestUtils.generateSha256Hash(),
        'signed-document.pdf',
        'kms-key-123',
        'RSA-SHA256',
        metadata
      )).toThrow(signerAlreadyDeclined('Signer has already declined'));
    });
  });

  describe('Decline Process', () => {
    it('should decline successfully with reason', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.PENDING
      });

      const reason = 'Document contains errors';

      signer.decline(reason);

      expect(signer.getStatus()).toBe(SignerStatus.DECLINED);
      expect(signer.getDeclinedAt()).toBeDefined();
      expect(signer.getDeclineReason()).toBe(reason);
    });

    it('should throw error when trying to decline already signed signer', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.SIGNED
      });

      expect(() => signer.decline('Reason'))
        .toThrow(signerAlreadySigned('Signer has already signed'));
    });

    it('should throw error when trying to decline already declined signer', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.DECLINED
      });

      expect(() => signer.decline('Reason'))
        .toThrow(signerAlreadyDeclined('Signer has already declined'));
    });
  });

  describe('Consent Management', () => {
    it('should record consent successfully', () => {
      const signer = createEnvelopeSignerWithParams({
        consentGiven: false
      });

      const consentText = 'I agree to sign this document electronically';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';

      signer.recordConsent(consentText, ipAddress, userAgent);

      expect(signer.getConsentGiven()).toBe(true);
      expect(signer.getConsentTimestamp()).toBeDefined();
      expect(signer.getIpAddress()).toBe(ipAddress);
      expect(signer.getUserAgent()).toBe(userAgent);
    });

    it('should throw error when consent text is empty', () => {
      const signer = createEnvelopeSignerWithParams({});

      expect(() => signer.recordConsent('', '192.168.1.1', 'Mozilla/5.0'))
        .toThrow(consentTextRequired('Consent text cannot be empty'));
    });

    it('should throw error when consent text is only whitespace', () => {
      const signer = createEnvelopeSignerWithParams({});

      expect(() => signer.recordConsent('   ', '192.168.1.1', 'Mozilla/5.0'))
        .toThrow(consentTextRequired('Consent text cannot be empty'));
    });

    it('should throw error when consent text is null', () => {
      const signer = createEnvelopeSignerWithParams({});

      expect(() => signer.recordConsent(null as any, '192.168.1.1', 'Mozilla/5.0'))
        .toThrow(consentTextRequired('Consent text cannot be empty'));
    });
  });

  describe('Status Checks', () => {
    it('should correctly identify signed status', () => {
      const signedSigner = createEnvelopeSignerWithParams({
        status: SignerStatus.SIGNED
      });

      expect(signedSigner.hasSigned()).toBe(true);
      expect(signedSigner.hasDeclined()).toBe(false);
      expect(signedSigner.isPending()).toBe(false);
    });

    it('should correctly identify declined status', () => {
      const declinedSigner = createEnvelopeSignerWithParams({
        status: SignerStatus.DECLINED
      });

      expect(declinedSigner.hasSigned()).toBe(false);
      expect(declinedSigner.hasDeclined()).toBe(true);
      expect(declinedSigner.isPending()).toBe(false);
    });

    it('should correctly identify pending status', () => {
      const pendingSigner = createEnvelopeSignerWithParams({
        status: SignerStatus.PENDING
      });

      expect(pendingSigner.hasSigned()).toBe(false);
      expect(pendingSigner.hasDeclined()).toBe(false);
      expect(pendingSigner.isPending()).toBe(true);
    });

    it('should correctly identify consent given', () => {
      const signerWithConsent = createEnvelopeSignerWithParams({
        consentGiven: true
      });

      const signerWithoutConsent = createEnvelopeSignerWithParams({
        consentGiven: false
      });

      const signerWithUndefinedConsent = createEnvelopeSignerWithParams({
        consentGiven: undefined
      });

      expect(signerWithConsent.hasGivenConsent()).toBe(true);
      expect(signerWithoutConsent.hasGivenConsent()).toBe(false);
      expect(signerWithUndefinedConsent.hasGivenConsent()).toBe(false);
    });
  });

  describe('Signature Value Object', () => {
    it('should return Signature value object when signer has signature data', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.SIGNED,
        documentHash: TestUtils.generateSha256Hash(),
        signatureHash: TestUtils.generateSha256Hash(),
        signedS3Key: 'signed-document.pdf',
        kmsKeyId: 'kms-key-123',
        algorithm: 'RSA-SHA256',
        signedAt: new Date('2024-01-02'),
        reason: 'Legal compliance',
        location: 'New York, NY',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });

      const signature = signer.getSignature();

      expect(signature).not.toBeNull();
      expect(signature?.getSignerId()).toBe(signer.getId().getValue());
      expect(signature?.getDocumentHash()).toBe(signer.getDocumentHash());
      expect(signature?.getSignatureHash()).toBe(signer.getSignatureHash());
      expect(signature?.getSignedS3Key()).toBe(signer.getSignedS3Key());
      expect(signature?.getKmsKeyId()).toBe(signer.getKmsKeyId());
      expect(signature?.getAlgorithm()).toBe(signer.getAlgorithm());
      expect(signature?.getSignedAt()).toEqual(signer.getSignedAt());
    });

    it('should return null when signer has no signature data', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.PENDING,
        documentHash: undefined,
        signatureHash: undefined
      });

      const signature = signer.getSignature();

      expect(signature).toBeNull();
    });

    it('should return null when signer has partial signature data', () => {
      const signer = createEnvelopeSignerWithParams({
        status: SignerStatus.SIGNED,
        documentHash: TestUtils.generateSha256Hash(),
        signatureHash: undefined // Missing signature hash
      });

      const signature = signer.getSignature();

      expect(signature).toBeNull();
    });
  });

  describe('Equality', () => {
    it('should return true for equal signers', () => {
      const signerId = TestUtils.generateUuid();
      const signer1 = createEnvelopeSignerWithParams({ id: signerId });
      const signer2 = createEnvelopeSignerWithParams({ id: signerId });

      expect(signer1.equals(signer2)).toBe(true);
    });

    it('should return false for different signers', () => {
      const signer1 = createEnvelopeSignerWithParams({ id: TestUtils.generateUuid() });
      const signer2 = createEnvelopeSignerWithParams({ id: TestUtils.generateUuid() });

      expect(signer1.equals(signer2)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle signer with all optional fields undefined', () => {
      const signer = createEnvelopeSignerWithParams({
        userId: undefined,
        email: undefined,
        fullName: undefined,
        invitedByUserId: undefined,
        signedAt: undefined,
        declinedAt: undefined,
        declineReason: undefined,
        consentGiven: undefined,
        consentTimestamp: undefined,
        documentHash: undefined,
        signatureHash: undefined,
        signedS3Key: undefined,
        kmsKeyId: undefined,
        algorithm: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        reason: undefined,
        location: undefined
      });

      expect(signer.getSignature()).toBeNull();
      expect(signer.hasGivenConsent()).toBe(false);
    });

    it('should handle external signer with email but no userId', () => {
      const signer = createEnvelopeSignerWithParams({
        isExternal: true,
        email: 'external@example.com',
        userId: undefined
      });

      expect(signer.getIsExternal()).toBe(true);
      expect(signer.getEmail()?.getValue()).toBe('external@example.com');
      expect(signer.getUserId()).toBeUndefined();
    });

    it('should handle internal signer with userId but no email', () => {
      const signer = createEnvelopeSignerWithParams({
        isExternal: false,
        userId: 'user-123',
        email: undefined
      });

      expect(signer.getIsExternal()).toBe(false);
      expect(signer.getUserId()).toBe('user-123');
      expect(signer.getEmail()).toBeUndefined();
    });
  });
});
