import { InvitationTokenValidationRule } from '../../../../src/domain/rules/InvitationTokenValidationRule';
import { InvitationToken } from '../../../../src/domain/entities/InvitationToken';
import { EnvelopeSigner } from '../../../../src/domain/entities/EnvelopeSigner';
import { TestUtils } from '../../../helpers/testUtils';
import { InvitationTokenBuilder } from '../../../helpers/builders/InvitationTokenBuilder';
import { InvitationTokenStatus } from '@prisma/client';
import { EnvelopeSignerBuilder } from '../../../helpers/builders/EnvelopeSignerBuilder';

describe('InvitationTokenValidationRule', () => {
  let token: InvitationToken;
  let signer: EnvelopeSigner;

  beforeEach(() => {
    const tokenId = TestUtils.generateUuid();
    const signerId = TestUtils.generateSignerId();
    const envelopeId = TestUtils.generateEnvelopeId();
    const createdBy = TestUtils.generateUuid();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    token = InvitationTokenBuilder.create()
      .withId(TestUtils.generateInvitationTokenId())
      .withSignerId(signerId)
      .withEnvelopeId(envelopeId)
      .withCreatedBy(createdBy)
      .withExpiresAt(expiresAt)
      .withUsedAt(null)
      .withRevokedAt(null)
      .build();

    signer = EnvelopeSignerBuilder.create()
      .withId(signerId)
      .withIsExternal(true)
      .withInvitedByUserId(createdBy)
      .build();
  });

  describe('validateToken', () => {
    it('should validate successfully when token is valid', () => {
      expect(() => {
        InvitationTokenValidationRule.validateToken(token);
      }).not.toThrow();
    });

    it('should throw when token is null', () => {
      expect(() => {
        InvitationTokenValidationRule.validateToken(null as any);
      }).toThrow('Invalid invitation token');
    });

    it('should throw when token is expired', () => {
      const expiredToken = InvitationTokenBuilder.create()
        .withId(TestUtils.generateInvitationTokenId())
        .withExpiresAt(new Date(Date.now() - 24 * 60 * 60 * 1000))
        .build();

      expect(() => {
        InvitationTokenValidationRule.validateToken(expiredToken);
      }).toThrow('expired');
    });

    it('should throw when token is already used', () => {
      const usedToken = InvitationTokenBuilder.create()
        .withId(TestUtils.generateInvitationTokenId())
        .withStatus(InvitationTokenStatus.SIGNED)
        .withUsedAt(new Date())
        .build();

      expect(() => {
        InvitationTokenValidationRule.validateToken(usedToken);
      }).toThrow('Invitation token has already been used');
    });

    it('should throw when token is revoked', () => {
      const revokedToken = InvitationTokenBuilder.create()
        .withId(TestUtils.generateInvitationTokenId())
        .withStatus(InvitationTokenStatus.REVOKED)
        .withRevokedAt(new Date())
        .withRevokedReason('Test revocation')
        .build();

      expect(() => {
        InvitationTokenValidationRule.validateToken(revokedToken);
      }).toThrow('Invitation token has been revoked');
    });
  });

  describe('validateViewerTokenAccess', () => {
    it('should validate successfully when token is valid for viewer', () => {
      expect(() => {
        InvitationTokenValidationRule.validateViewerTokenAccess(token);
      }).not.toThrow();
    });

    it('should throw when token is null', () => {
      expect(() => {
        InvitationTokenValidationRule.validateViewerTokenAccess(null as any);
      }).toThrow('Invalid invitation token');
    });

    it('should throw when token is expired', () => {
      const expiredToken = InvitationTokenBuilder.create()
        .withId(TestUtils.generateInvitationTokenId())
        .withExpiresAt(new Date(Date.now() - 24 * 60 * 60 * 1000))
        .build();

      expect(() => {
        InvitationTokenValidationRule.validateViewerTokenAccess(expiredToken);
      }).toThrow('expired');
    });

    it('should throw when token is revoked', () => {
      const revokedToken = InvitationTokenBuilder.create()
        .withId(TestUtils.generateInvitationTokenId())
        .withStatus(InvitationTokenStatus.REVOKED)
        .withRevokedAt(new Date())
        .withRevokedReason('Test revocation')
        .build();

      expect(() => {
        InvitationTokenValidationRule.validateViewerTokenAccess(revokedToken);
      }).toThrow('Invitation token has been revoked');
    });

    it('should allow viewer access even if token is used', () => {
      const usedToken = InvitationTokenBuilder.create()
        .withId(TestUtils.generateInvitationTokenId())
        .withUsedAt(new Date())
        .build();

      expect(() => {
        InvitationTokenValidationRule.validateViewerTokenAccess(usedToken);
      }).not.toThrow();
    });
  });

  describe('validateSignerAccess', () => {
    it('should validate successfully when signer has valid access', () => {
      expect(() => {
        InvitationTokenValidationRule.validateSignerAccess(token, signer);
      }).not.toThrow();
    });

    it('should throw when signer is null', () => {
      expect(() => {
        InvitationTokenValidationRule.validateSignerAccess(token, null as any);
      }).toThrow('Signer not found');
    });

    it('should throw when signer was not invited by token creator', () => {
      const differentCreator = TestUtils.generateUuid();
      const differentSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withIsExternal(true)
        .withInvitedByUserId(differentCreator)
        .build();

      expect(() => {
        InvitationTokenValidationRule.validateSignerAccess(token, differentSigner);
      }).toThrow('Signer not found');
    });

    it('should throw when signer is not external', () => {
      const internalSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withIsExternal(false)
        .withInvitedByUserId(token.getCreatedBy() || undefined)
        .build();

      expect(() => {
        InvitationTokenValidationRule.validateSignerAccess(token, internalSigner);
      }).toThrow('Signer not found');
    });

    it('should throw when token does not belong to signer', () => {
      const differentSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withIsExternal(true)
        .withInvitedByUserId(token.getCreatedBy() || undefined)
        .build();

      expect(() => {
        InvitationTokenValidationRule.validateSignerAccess(token, differentSigner);
      }).toThrow('Signer not found');
    });
  });

  describe('validateTokenCreation', () => {
    it('should validate successfully when user can create token', () => {
      expect(() => {
        InvitationTokenValidationRule.validateTokenCreation(signer, token.getCreatedBy()!);
      }).not.toThrow();
    });

    it('should throw when signer is null', () => {
      expect(() => {
        InvitationTokenValidationRule.validateTokenCreation(null as any, TestUtils.generateUuid());
      }).toThrow('Signer not found');
    });

    it('should throw when user is not authorized to create token', () => {
      const differentUser = TestUtils.generateUuid();

      expect(() => {
        InvitationTokenValidationRule.validateTokenCreation(signer, differentUser);
      }).toThrow('Signer not found');
    });

    it('should throw when signer is not external', () => {
      const internalSigner = EnvelopeSignerBuilder.create()
        .withId(TestUtils.generateSignerId())
        .withIsExternal(false)
        .withInvitedByUserId(token.getCreatedBy() || undefined)
        .build();

      expect(() => {
        InvitationTokenValidationRule.validateTokenCreation(internalSigner, token.getCreatedBy()!);
      }).toThrow('Signer not found');
    });
  });

  describe('validateExpiration', () => {
    it('should validate successfully when expiration is valid', () => {
      const validExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);

      expect(() => {
        InvitationTokenValidationRule.validateExpiration(validExpiration);
      }).not.toThrow();
    });

    it('should throw when expiration is null', () => {
      expect(() => {
        InvitationTokenValidationRule.validateExpiration(null as any);
      }).toThrow('Invalid invitation token');
    });

    it('should throw when expiration is in the past', () => {
      const pastExpiration = new Date(Date.now() - 24 * 60 * 60 * 1000);

      expect(() => {
        InvitationTokenValidationRule.validateExpiration(pastExpiration);
      }).toThrow('Invalid invitation token');
    });

    it('should throw when expiration is too far in the future', () => {
      const tooFarExpiration = new Date();
      tooFarExpiration.setFullYear(tooFarExpiration.getFullYear() + 2);

      expect(() => {
        InvitationTokenValidationRule.validateExpiration(tooFarExpiration);
      }).toThrow('Invalid invitation token');
    });

    it('should allow expiration exactly one year in the future', () => {
      const oneYearExpiration = new Date();
      oneYearExpiration.setFullYear(oneYearExpiration.getFullYear() + 1);

      expect(() => {
        InvitationTokenValidationRule.validateExpiration(oneYearExpiration);
      }).not.toThrow();
    });
  });
});
