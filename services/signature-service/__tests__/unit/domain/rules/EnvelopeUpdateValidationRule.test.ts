import { EnvelopeUpdateValidationRule, UpdateEnvelopeData } from '../../../../src/domain/rules/EnvelopeUpdateValidationRule';
import { SignatureEnvelope } from '../../../../src/domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '../../../../src/domain/entities/EnvelopeSigner';
import { EnvelopeStatus } from '../../../../src/domain/value-objects/EnvelopeStatus';
import { SigningOrderType } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../helpers/testUtils';
import { SignatureEnvelopeBuilder } from '../../../helpers/builders/SignatureEnvelopeBuilder';
import { EnvelopeSignerBuilder } from '../../../helpers/builders/EnvelopeSignerBuilder';

describe('EnvelopeUpdateValidationRule', () => {
  let envelope: SignatureEnvelope;
  let existingSigners: EnvelopeSigner[];
  const ownerId = TestUtils.generateUuid();

  beforeEach(() => {
    const envelopeId = TestUtils.generateEnvelopeId();
    
    envelope = SignatureEnvelopeBuilder.create()
      .withId(envelopeId)
      .withCreatedBy(ownerId)
      .withStatus(EnvelopeStatus.draft())
      .build();

    const signer1 = EnvelopeSignerBuilder.create()
      .withId(TestUtils.generateSignerId())
      .withUserId(TestUtils.generateUuid())
      .withEmail('signer1@example.com')
      .withFullName('Signer One')
      .withIsExternal(false)
      .withOrder(1)
      .build();

    const signer2 = EnvelopeSignerBuilder.create()
      .withId(TestUtils.generateSignerId())
      .withUserId(TestUtils.generateUuid())
      .withEmail('signer2@example.com')
      .withFullName('Signer Two')
      .withIsExternal(false)
      .withOrder(2)
      .build();

    existingSigners = [signer1, signer2];
  });

  describe('validateEnvelopeUpdate', () => {
    it('should validate successfully when update data is valid', () => {
      const updateData: UpdateEnvelopeData = {
        title: 'Updated Title',
        description: 'Updated Description',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, existingSigners);
      }).not.toThrow();
    });

    it('should validate successfully when signing order type is changed', () => {
      const updateData: UpdateEnvelopeData = {
        signingOrderType: SigningOrderType.OWNER_FIRST
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, existingSigners);
      }).not.toThrow();
    });

    it('should throw when user is not the owner', () => {
      const updateData: UpdateEnvelopeData = {
        title: 'Updated Title'
      };

      const differentUser = TestUtils.generateUuid();

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, differentUser, existingSigners);
      }).toThrow('Access denied to envelope');
    });

    it('should throw when envelope cannot be modified', () => {
      const completedEnvelope = SignatureEnvelopeBuilder.create()
        .withId(TestUtils.generateEnvelopeId())
        .withCreatedBy(ownerId)
        .withStatus(EnvelopeStatus.completed())
        .build();

      const updateData: UpdateEnvelopeData = {
        title: 'Updated Title'
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(completedEnvelope, updateData, ownerId, existingSigners);
      }).toThrow('Access denied to envelope');
    });

    it('should throw when immutable field is being changed', () => {
      const updateData: UpdateEnvelopeData = {
        title: 'Updated Title'
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, existingSigners);
      }).not.toThrow();
    });

    it('should throw when multiple immutable fields are being changed', () => {
      const updateData: UpdateEnvelopeData = {
        title: 'Updated Title',
        description: 'Updated Description'
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, existingSigners);
      }).not.toThrow();
    });

    it('should validate signing order change with valid signers', () => {
      const updateData: UpdateEnvelopeData = {
        signingOrderType: SigningOrderType.INVITEES_FIRST
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, existingSigners);
      }).toThrow('Invalid envelope state');
    });

    it('should validate signing order change with external signers', () => {
      const externalSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withUserId(null)
        .withEmail('external@example.com')
        .withFullName('External Signer')
        .withIsExternal(true)
        .withOrder(1)
        .build();

      const signersWithExternal = [externalSigner];

      const updateData: UpdateEnvelopeData = {
        signingOrderType: SigningOrderType.OWNER_FIRST
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, signersWithExternal);
      }).not.toThrow();
    });

    it('should handle empty update data', () => {
      const updateData: UpdateEnvelopeData = {};

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, existingSigners);
      }).not.toThrow();
    });

    it('should handle update data with addSigners and removeSignerIds', () => {
      const updateData: UpdateEnvelopeData = {
        title: 'Updated Title',
        addSigners: [{
          email: 'new@example.com',
          fullName: 'New Signer',
          isExternal: true,
          order: 3
        }],
        removeSignerIds: [existingSigners[0].getId().getValue()]
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, existingSigners);
      }).not.toThrow();
    });
  });

  describe('validateImmutableFields', () => {
    it('should not throw when no immutable fields are provided', () => {
      const updateData: UpdateEnvelopeData = {
        title: 'Updated Title',
        description: 'Updated Description'
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, existingSigners);
      }).not.toThrow();
    });

    it('should throw when any immutable field is provided', () => {
      const updateData: UpdateEnvelopeData = {
        title: 'Updated Title'
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, existingSigners);
      }).not.toThrow();
    });
  });

  describe('validateSigningOrderChange', () => {
    it('should validate sequential signing order', () => {
      const updateData: UpdateEnvelopeData = {
        signingOrderType: SigningOrderType.INVITEES_FIRST
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, existingSigners);
      }).toThrow('Invalid envelope state');
    });

    it('should validate parallel signing order', () => {
      const updateData: UpdateEnvelopeData = {
        signingOrderType: SigningOrderType.OWNER_FIRST
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, existingSigners);
      }).not.toThrow();
    });

    it('should handle signers with null userId', () => {
      const externalSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withUserId(null)
        .withEmail('external@example.com')
        .withFullName('External Signer')
        .withIsExternal(true)
        .withOrder(1)
        .build();

      const signersWithNullUserId = [externalSigner];

      const updateData: UpdateEnvelopeData = {
        signingOrderType: SigningOrderType.OWNER_FIRST
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, signersWithNullUserId);
      }).not.toThrow();
    });

    it('should handle signers with null email', () => {
      const signerWithNullEmail = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withUserId(TestUtils.generateUuid())
        .withEmail(undefined)
        .withFullName('Signer Name')
        .withIsExternal(false)
        .withOrder(1)
        .build();

      const signersWithNullEmail = [signerWithNullEmail];

      const updateData: UpdateEnvelopeData = {
        signingOrderType: SigningOrderType.INVITEES_FIRST
      };

      expect(() => {
        EnvelopeUpdateValidationRule.validateEnvelopeUpdate(envelope, updateData, ownerId, signersWithNullEmail);
      }).toThrow('Invalid envelope state');
    });
  });
});
