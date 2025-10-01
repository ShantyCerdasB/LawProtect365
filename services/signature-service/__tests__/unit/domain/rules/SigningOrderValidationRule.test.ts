import { SigningOrderValidationRule } from '../../../../src/domain/rules/SigningOrderValidationRule';
import { SignatureEnvelope } from '../../../../src/domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '../../../../src/domain/entities/EnvelopeSigner';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { SigningOrder } from '../../../../src/domain/value-objects/SigningOrder';
import { SigningOrderType } from '@prisma/client';
import { TestUtils } from '../../../helpers/testUtils';
import { SignatureEnvelopeBuilder } from '../../../helpers/builders/SignatureEnvelopeBuilder';
import { EnvelopeSignerBuilder } from '../../../helpers/builders/EnvelopeSignerBuilder';

describe('SigningOrderValidationRule', () => {
  let envelope: SignatureEnvelope;
  let signers: EnvelopeSigner[];
  const ownerId = TestUtils.generateUuid();

  beforeEach(() => {
    const envelopeId = TestUtils.generateEnvelopeId();
    
    envelope = SignatureEnvelopeBuilder.create()
      .withId(envelopeId)
      .withCreatedBy(ownerId)
      .withSigningOrder(SigningOrder.ownerFirst())
      .build();

    const signer1 = EnvelopeSignerBuilder.create()
      .withId(TestUtils.generateSignerId())
      .withUserId(ownerId)
      .withOrder(1)
      .build();

    const signer2 = EnvelopeSignerBuilder.create()
      .withId(TestUtils.generateSignerId())
      .withUserId(TestUtils.generateUuid())
      .withOrder(2)
      .build();

    signers = [signer1, signer2];
  });

  describe('validateSigningOrder', () => {
    it('should validate successfully when signer is in correct order for OWNER_FIRST', () => {
      const currentSignerId = signers[0].getId();

      expect(() => {
        SigningOrderValidationRule.validateSigningOrder(envelope, currentSignerId, ownerId, signers);
      }).not.toThrow();
    });

    it('should throw when signer is not found', () => {
      const nonExistentSignerId = TestUtils.generateSignerId();

      expect(() => {
        SigningOrderValidationRule.validateSigningOrder(envelope, nonExistentSignerId, ownerId, signers);
      }).toThrow('Signer not found');
    });

    it('should throw when signer tries to sign out of order for OWNER_FIRST', () => {
      const secondSignerId = signers[1].getId();

      expect(() => {
        SigningOrderValidationRule.validateSigningOrder(envelope, secondSignerId, ownerId, signers);
      }).toThrow('Signing order violation');
    });

    it('should validate successfully when signer is in correct order for INVITEES_FIRST', () => {
      const inviteesFirstEnvelope = SignatureEnvelopeBuilder.create()
        .withId(TestUtils.generateEnvelopeId())
        .withCreatedBy(ownerId)
        .withSigningOrder(SigningOrder.inviteesFirst())
        .build();

      const secondSignerId = signers[1].getId();

      expect(() => {
        SigningOrderValidationRule.validateSigningOrder(inviteesFirstEnvelope, secondSignerId, ownerId, signers);
      }).not.toThrow();
    });

    it('should throw when owner tries to sign before all invitees in INVITEES_FIRST order', () => {
      const inviteesFirstEnvelope = SignatureEnvelopeBuilder.create()
        .withId(TestUtils.generateEnvelopeId())
        .withCreatedBy(ownerId)
        .withSigningOrder(SigningOrder.inviteesFirst())
        .build();

      // Create signers where owner is first but there are external signers who haven't signed
      const externalSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withUserId(TestUtils.generateUuid())
        .withIsExternal(true)
        .withOrder(1)
        .build();

      const ownerSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withUserId(ownerId)
        .withIsExternal(false)
        .withOrder(2)
        .build();

      const testSigners = [ownerSigner, externalSigner];

      expect(() => {
        SigningOrderValidationRule.validateSigningOrder(inviteesFirstEnvelope, ownerSigner.getId(), ownerId, testSigners);
      }).toThrow('Signing order violation');
    });
  });

  describe('validateSigningOrderConsistency', () => {
    it('should validate successfully when signing order is consistent', () => {
      const signersData = signers.map(signer => ({
        envelopeId: envelope.getId(),
        userId: signer.getUserId() || undefined,
        email: signer.getEmail()?.getValue() || '',
        fullName: signer.getFullName() || '',
        isExternal: signer.getIsExternal(),
        order: signer.getOrder(),
        participantRole: 'SIGNER' as const
      }));

      expect(() => {
        SigningOrderValidationRule.validateSigningOrderConsistency(
          SigningOrderType.OWNER_FIRST,
          signersData,
          ownerId
        );
      }).not.toThrow();
    });

    it('should throw when signing order is inconsistent', () => {
      const inconsistentSignersData = [
        {
          envelopeId: envelope.getId(),
          userId: TestUtils.generateUuid(),
          email: 'external@example.com',
          fullName: 'External User',
          isExternal: true,
          order: 1,
          participantRole: 'SIGNER' as const
        },
        {
          envelopeId: envelope.getId(),
          userId: ownerId,
          email: 'owner@example.com',
          fullName: 'Owner',
          isExternal: false,
          order: 2,
          participantRole: 'SIGNER' as const
        }
      ];

      expect(() => {
        SigningOrderValidationRule.validateSigningOrderConsistency(
          SigningOrderType.OWNER_FIRST,
          inconsistentSignersData,
          ownerId
        );
      }).toThrow('Invalid envelope state');
    });

    it('should validate INVITEES_FIRST order successfully', () => {
      const inviteesFirstData = [
        {
          envelopeId: envelope.getId(),
          userId: TestUtils.generateUuid(),
          email: 'external@example.com',
          fullName: 'External User',
          isExternal: true,
          order: 1,
          participantRole: 'SIGNER' as const
        },
        {
          envelopeId: envelope.getId(),
          userId: ownerId,
          email: 'owner@example.com',
          fullName: 'Owner',
          isExternal: false,
          order: 2,
          participantRole: 'SIGNER' as const
        }
      ];

      expect(() => {
        SigningOrderValidationRule.validateSigningOrderConsistency(
          SigningOrderType.INVITEES_FIRST,
          inviteesFirstData,
          ownerId
        );
      }).not.toThrow();
    });
  });
});
