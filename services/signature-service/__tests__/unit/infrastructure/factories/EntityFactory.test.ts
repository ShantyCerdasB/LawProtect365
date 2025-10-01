import { EntityFactory } from '../../../../src/infrastructure/factories/EntityFactory';
import { TestUtils } from '../../../helpers/testUtils';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { InvitationTokenId } from '../../../../src/domain/value-objects/InvitationTokenId';
import { ConsentId } from '../../../../src/domain/value-objects/ConsentId';
import { DocumentOrigin } from '../../../../src/domain/value-objects/DocumentOrigin';
import { SigningOrder } from '../../../../src/domain/value-objects/SigningOrder';
import { S3Key } from '@lawprotect/shared-ts';

describe('EntityFactory', () => {
  it('should be importable', () => {
    expect(EntityFactory).toBeDefined();
  });

  it('should have create method', () => {
    expect(EntityFactory.create).toBeDefined();
    expect(typeof EntityFactory.create).toBe('function');
  });

  it('should have createSignatureEnvelope method', () => {
    expect(EntityFactory.createSignatureEnvelope).toBeDefined();
    expect(typeof EntityFactory.createSignatureEnvelope).toBe('function');
  });

  it('should have createEnvelopeSigner method', () => {
    expect(EntityFactory.createEnvelopeSigner).toBeDefined();
    expect(typeof EntityFactory.createEnvelopeSigner).toBe('function');
  });

  it('should have createInvitationToken method', () => {
    expect(EntityFactory.createInvitationToken).toBeDefined();
    expect(typeof EntityFactory.createInvitationToken).toBe('function');
  });

  it('should have createConsent method', () => {
    expect(EntityFactory.createConsent).toBeDefined();
    expect(typeof EntityFactory.createConsent).toBe('function');
  });

  it('should have createValueObjects property', () => {
    expect(EntityFactory.createValueObjects).toBeDefined();
    expect(typeof EntityFactory.createValueObjects).toBe('object');
  });

  describe('create method', () => {
    it('should create SignatureEnvelope when entityType is SignatureEnvelope', () => {
      const data = {
        id: EnvelopeId.fromString(TestUtils.generateUuid()),
        createdBy: TestUtils.generateUuid(),
        title: 'Test Envelope',
        description: 'Test Description',
        origin: DocumentOrigin.userUpload(),
        signingOrder: SigningOrder.ownerFirst(),
        sourceKey: S3Key.fromString('source-key'),
        metaKey: S3Key.fromString('meta-key'),
      };

      const result = EntityFactory.create('SignatureEnvelope', data);
      expect(result).toBeDefined();
      expect(result.constructor.name).toBe('SignatureEnvelope');
    });

    it('should create EnvelopeSigner when entityType is EnvelopeSigner', () => {
      const data = {
        envelopeId: EnvelopeId.fromString(TestUtils.generateUuid()),
        userId: TestUtils.generateUuid(),
        email: 'test@example.com',
        fullName: 'Test User',
        isExternal: true,
        order: 1,
        participantRole: 'SIGNER' as const,
      };

      const result = EntityFactory.create('EnvelopeSigner', data);
      expect(result).toBeDefined();
      expect(result.constructor.name).toBe('EnvelopeSigner');
    });

    it('should create InvitationToken when entityType is InvitationToken', () => {
      const data = {
        id: InvitationTokenId.fromString(TestUtils.generateUuid()),
        envelopeId: EnvelopeId.fromString(TestUtils.generateUuid()),
        signerId: SignerId.fromString(TestUtils.generateUuid()),
        createdBy: TestUtils.generateUuid(),
        expiresAt: new Date(),
      };

      const result = EntityFactory.create('InvitationToken', data);
      expect(result).toBeDefined();
      expect(result.constructor.name).toBe('InvitationToken');
    });

    it('should create Consent when entityType is Consent', () => {
      const data = {
        id: ConsentId.fromString(TestUtils.generateUuid()),
        envelopeId: EnvelopeId.fromString(TestUtils.generateUuid()),
        signerId: SignerId.fromString(TestUtils.generateUuid()),
        signatureId: TestUtils.generateUuid(),
        consentGiven: true,
        consentTimestamp: new Date(),
        consentText: 'I consent to sign',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent',
        country: 'US',
        userEmail: 'test@example.com',
      };

      const result = EntityFactory.create('Consent', data);
      expect(result).toBeDefined();
      expect(result.constructor.name).toBe('Consent');
    });

    it('should throw error for unsupported entity type', () => {
      expect(() => {
        EntityFactory.create('UnsupportedType', {});
      }).toThrow('Unsupported entity type: UnsupportedType');
    });
  });

  describe('createValueObjects', () => {
    it('should create EnvelopeId from string', () => {
      const value = TestUtils.generateUuid();
      const result = EntityFactory.createValueObjects.envelopeId(value);
      expect(result).toBeDefined();
      expect(result.getValue()).toBe(value);
    });

    it('should create SignerId from string', () => {
      const value = TestUtils.generateUuid();
      const result = EntityFactory.createValueObjects.signerId(value);
      expect(result).toBeDefined();
      expect(result.getValue()).toBe(value);
    });

    it('should generate SignerId when no value provided', () => {
      const result = EntityFactory.createValueObjects.signerId();
      expect(result).toBeDefined();
      expect(result.getValue()).toBeDefined();
    });

    it('should create InvitationTokenId from string', () => {
      const value = TestUtils.generateUuid();
      const result = EntityFactory.createValueObjects.invitationTokenId(value);
      expect(result).toBeDefined();
      expect(result.getValue()).toBe(value);
    });

    it('should generate InvitationTokenId when no value provided', () => {
      const result = EntityFactory.createValueObjects.invitationTokenId();
      expect(result).toBeDefined();
      expect(result.getValue()).toBeDefined();
    });

    it('should create ConsentId from string', () => {
      const value = TestUtils.generateUuid();
      const result = EntityFactory.createValueObjects.consentId(value);
      expect(result).toBeDefined();
      expect(result.getValue()).toBe(value);
    });

    it('should generate ConsentId when no value provided', () => {
      const result = EntityFactory.createValueObjects.consentId();
      expect(result).toBeDefined();
      expect(result.getValue()).toBeDefined();
    });
  });
});
