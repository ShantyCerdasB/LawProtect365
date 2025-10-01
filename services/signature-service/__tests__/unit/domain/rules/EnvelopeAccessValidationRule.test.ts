import { EnvelopeAccessValidationRule } from '../../../../src/domain/rules/EnvelopeAccessValidationRule';
import { SignatureEnvelope } from '../../../../src/domain/entities/SignatureEnvelope';
import { InvitationToken } from '../../../../src/domain/entities/InvitationToken';
import { EnvelopeStatus } from '../../../../src/domain/value-objects/EnvelopeStatus';
import { TestUtils } from '../../../helpers/testUtils';
import { SignatureEnvelopeBuilder } from '../../../helpers/builders/SignatureEnvelopeBuilder';
import { InvitationTokenBuilder } from '../../../helpers/builders/InvitationTokenBuilder';
import { InvitationTokenStatus } from '@prisma/client';

describe('EnvelopeAccessValidationRule', () => {
  let envelope: SignatureEnvelope;
  let invitationToken: InvitationToken;
  const ownerId = TestUtils.generateUuid();
  const externalUserId = TestUtils.generateUuid();

  beforeEach(() => {
    const envelopeId = TestUtils.generateEnvelopeId();
    
    envelope = SignatureEnvelopeBuilder.create()
      .withId(envelopeId)
      .withCreatedBy(ownerId)
      .withStatus(EnvelopeStatus.draft())
      .withSentAt(new Date())
      .build();

    invitationToken = InvitationTokenBuilder.create()
      .withId(TestUtils.generateInvitationTokenId())
      .withEnvelopeId(envelopeId)
      .withCreatedBy(ownerId)
      .withExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000))
      .withUsedAt(null)
      .withRevokedAt(null)
      .build();
  });

  describe('validateEnvelopeAccess', () => {
    it('should validate successfully when user is the owner', () => {
      const result = EnvelopeAccessValidationRule.validateEnvelopeAccess(envelope, ownerId);

      expect(result).toBe(envelope);
    });

    it('should validate successfully when external user has valid invitation token', () => {
      const result = EnvelopeAccessValidationRule.validateEnvelopeAccess(envelope, externalUserId, invitationToken);

      expect(result).toBe(envelope);
    });

    it('should throw when envelope is null', () => {
      expect(() => {
        EnvelopeAccessValidationRule.validateEnvelopeAccess(null, ownerId);
      }).toThrow('Envelope not found');
    });

    it('should throw when user is not owner and has no invitation token', () => {
      expect(() => {
        EnvelopeAccessValidationRule.validateEnvelopeAccess(envelope, externalUserId);
      }).toThrow('Access denied to envelope');
    });

    it('should throw when invitation token is for different envelope', () => {
      const differentEnvelopeId = TestUtils.generateEnvelopeId();
      const differentEnvelope = SignatureEnvelopeBuilder.create()
        .withId(differentEnvelopeId)
        .withCreatedBy(ownerId)
        .build();

      expect(() => {
        EnvelopeAccessValidationRule.validateEnvelopeAccess(differentEnvelope, externalUserId, invitationToken);
      }).toThrow('Access denied to envelope');
    });

    it('should throw when invitation token is expired', () => {
      const expiredToken = InvitationTokenBuilder.create()
        .withId(TestUtils.generateInvitationTokenId())
        .withEnvelopeId(envelope.getId())
        .withCreatedBy(ownerId)
        .withExpiresAt(new Date(Date.now() - 24 * 60 * 60 * 1000))
        .build();

      expect(() => {
        EnvelopeAccessValidationRule.validateEnvelopeAccess(envelope, externalUserId, expiredToken);
      }).toThrow('Access denied to envelope');
    });

    it('should throw when invitation token is revoked', () => {
      const revokedToken = InvitationTokenBuilder.create()
        .withId(TestUtils.generateInvitationTokenId())
        .withEnvelopeId(envelope.getId())
        .withCreatedBy(ownerId)
        .withStatus(InvitationTokenStatus.REVOKED)
        .withRevokedAt(new Date())
        .withRevokedReason('Test revocation')
        .build();

      expect(() => {
        EnvelopeAccessValidationRule.validateEnvelopeAccess(envelope, externalUserId, revokedToken);
      }).toThrow('Access denied to envelope');
    });
  });

  describe('validateEnvelopeModificationAccess', () => {
    it('should validate successfully when user is the owner and envelope can be modified', () => {
      const draftEnvelope = SignatureEnvelopeBuilder.create()
        .withId(TestUtils.generateEnvelopeId())
        .withCreatedBy(ownerId)
        .withStatus(EnvelopeStatus.draft())
        .build();

      const result = EnvelopeAccessValidationRule.validateEnvelopeModificationAccess(draftEnvelope, ownerId);

      expect(result).toBe(draftEnvelope);
    });

    it('should throw when envelope is null', () => {
      expect(() => {
        EnvelopeAccessValidationRule.validateEnvelopeModificationAccess(null, ownerId);
      }).toThrow('Envelope not found');
    });

    it('should throw when user is not the owner', () => {
      expect(() => {
        EnvelopeAccessValidationRule.validateEnvelopeModificationAccess(envelope, externalUserId);
      }).toThrow('Access denied to envelope');
    });

    it('should throw when envelope cannot be modified', () => {
      const completedEnvelope = SignatureEnvelopeBuilder.create()
        .withId(TestUtils.generateEnvelopeId())
        .withCreatedBy(ownerId)
        .withStatus(EnvelopeStatus.completed())
        .build();

      expect(() => {
        EnvelopeAccessValidationRule.validateEnvelopeModificationAccess(completedEnvelope, ownerId);
      }).toThrow('Access denied to envelope');
    });
  });

  describe('validateEnvelopeDeletionAccess', () => {
    it('should validate successfully when user is the owner and envelope can be deleted', () => {
      const draftEnvelope = SignatureEnvelopeBuilder.create()
        .withId(TestUtils.generateEnvelopeId())
        .withCreatedBy(ownerId)
        .withStatus(EnvelopeStatus.draft())
        .build();

      const result = EnvelopeAccessValidationRule.validateEnvelopeDeletionAccess(draftEnvelope, ownerId);

      expect(result).toBe(draftEnvelope);
    });

    it('should throw when envelope is null', () => {
      expect(() => {
        EnvelopeAccessValidationRule.validateEnvelopeDeletionAccess(null, ownerId);
      }).toThrow('Envelope not found');
    });

    it('should throw when user is not the owner', () => {
      expect(() => {
        EnvelopeAccessValidationRule.validateEnvelopeDeletionAccess(envelope, externalUserId);
      }).toThrow('Access denied to envelope');
    });

    it('should throw when envelope cannot be deleted', () => {
      const completedEnvelope = SignatureEnvelopeBuilder.create()
        .withId(TestUtils.generateEnvelopeId())
        .withCreatedBy(ownerId)
        .withStatus(EnvelopeStatus.completed())
        .build();

      expect(() => {
        EnvelopeAccessValidationRule.validateEnvelopeDeletionAccess(completedEnvelope, ownerId);
      }).toThrow('Access denied to envelope');
    });
  });
});
