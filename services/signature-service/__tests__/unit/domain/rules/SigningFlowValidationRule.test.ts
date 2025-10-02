import { SigningFlowValidationRule } from '../../../../src/domain/rules/SigningFlowValidationRule';
import { SignatureEnvelope } from '../../../../src/domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '../../../../src/domain/entities/EnvelopeSigner';
import { EnvelopeStatus } from '../../../../src/domain/value-objects/EnvelopeStatus';
import { SignerStatus } from '@prisma/client';
import { TestUtils } from '../../../helpers/testUtils';
import { SignatureEnvelopeBuilder } from '../../../helpers/builders/SignatureEnvelopeBuilder';
import { EnvelopeSignerBuilder } from '../../../helpers/builders/EnvelopeSignerBuilder';

describe('SigningFlowValidationRule', () => {
  let rule: SigningFlowValidationRule;
  let envelope: SignatureEnvelope;
  let signer: EnvelopeSigner;
  let allSigners: EnvelopeSigner[];

  beforeEach(() => {
    rule = new SigningFlowValidationRule();
    envelope = SignatureEnvelopeBuilder.create()
      .withId(TestUtils.generateEnvelopeId())
      .withStatus(EnvelopeStatus.readyForSignature())
      .withCreatedBy(TestUtils.generateUuid())
      .withSentAt(new Date())
      .build();
    
    signer = EnvelopeSignerBuilder.create()
      .withId(TestUtils.generateSignerId())
      .withStatus(SignerStatus.PENDING)
      .withIsExternal(false)
      .withUserId(TestUtils.generateUuid())
      .build();
    
    allSigners = [signer];
  });

  describe('validateSigningFlow', () => {
    it('should validate successfully when all conditions are met', () => {
      expect(() => {
        rule.validateSigningFlow(envelope, signer, TestUtils.generateUuid(), allSigners);
      }).not.toThrow();
    });

    it('should throw when envelope is not ready for signature', () => {
      const draftEnvelope = SignatureEnvelopeBuilder.create()
        .withId(TestUtils.generateEnvelopeId())
        .withStatus(EnvelopeStatus.draft())
        .withCreatedBy(TestUtils.generateUuid())
        .build();

      expect(() => {
        rule.validateSigningFlow(draftEnvelope, signer, TestUtils.generateUuid(), allSigners);
      }).toThrow('Invalid envelope state');
    });

    it('should throw when signer is not in pending status', () => {
      const signedSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withStatus(SignerStatus.SIGNED)
        .withIsExternal(false)
        .withUserId(TestUtils.generateUuid())
        .build();

      expect(() => {
        rule.validateSigningFlow(envelope, signedSigner, TestUtils.generateUuid(), allSigners);
      }).toThrow('Invalid signer state');
    });

    it('should throw when external signer tries to sign unsent envelope', () => {
      const externalSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withStatus(SignerStatus.PENDING)
        .withIsExternal(true)
        .withUserId(TestUtils.generateUuid())
        .build();

      const unsentEnvelope = SignatureEnvelopeBuilder.create()
        .withId(TestUtils.generateEnvelopeId())
        .withStatus(EnvelopeStatus.readyForSignature())
        .withCreatedBy(TestUtils.generateUuid())
        .withSentAt(undefined)
        .build();

      expect(() => {
        rule.validateSigningFlow(unsentEnvelope, externalSigner, TestUtils.generateUuid(), [externalSigner]);
      }).toThrow('Invalid envelope state');
    });

    it('should allow external signer to sign sent envelope', () => {
      const externalSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withStatus(SignerStatus.PENDING)
        .withIsExternal(true)
        .withUserId(TestUtils.generateUuid())
        .build();

      const sentEnvelope = SignatureEnvelopeBuilder.create()
        .withId(TestUtils.generateEnvelopeId())
        .withStatus(EnvelopeStatus.readyForSignature())
        .withCreatedBy(TestUtils.generateUuid())
        .withSentAt(new Date())
        .build();

      expect(() => {
        rule.validateSigningFlow(sentEnvelope, externalSigner, TestUtils.generateUuid(), [externalSigner]);
      }).not.toThrow();
    });

    it('should allow owner to sign even if envelope is not sent', () => {
      const ownerId = TestUtils.generateUuid();
      const ownerSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withStatus(SignerStatus.PENDING)
        .withIsExternal(false)
        .withUserId(ownerId)
        .build();

      const ownerEnvelope = SignatureEnvelopeBuilder.create()
        .withId(TestUtils.generateEnvelopeId())
        .withStatus(EnvelopeStatus.readyForSignature())
        .withCreatedBy(ownerId)
        .withSentAt(undefined)
        .build();

      expect(() => {
        rule.validateSigningFlow(ownerEnvelope, ownerSigner, ownerId, [ownerSigner]);
      }).not.toThrow();
    });
  });
});
