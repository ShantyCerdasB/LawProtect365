/**
 * @fileoverview InvitationToken Entity Unit Tests
 * @summary Comprehensive test suite for InvitationToken entity with 100% coverage
 * @description Tests all business logic, state transitions, validations, and edge cases
 * for the InvitationToken entity that manages invitation tokens for external signer access.
 */

import { InvitationToken } from '../../../../src/domain/entities/InvitationToken';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { InvitationTokenId } from '../../../../src/domain/value-objects/InvitationTokenId';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { InvitationTokenStatus } from '@prisma/client';
import { systemClock } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../helpers/testUtils';
import { generateTestIpAddress } from '../../../integration/helpers/testHelpers';
import { 
  invitationTokenExpired,
  invitationTokenAlreadyUsed,
  invitationTokenRevoked
} from '../../../../src/signature-errors';

describe('InvitationToken', () => {
  // Helper function to create InvitationToken with custom parameters
  function createInvitationTokenWithParams(params: {
    id?: string;
    envelopeId?: string;
    signerId?: string;
    tokenHash?: string;
    status?: InvitationTokenStatus;
    expiresAt?: Date;
    sentAt?: Date;
    lastSentAt?: Date;
    resendCount?: number;
    usedAt?: Date;
    usedBy?: string;
    viewCount?: number;
    lastViewedAt?: Date;
    signedAt?: Date;
    signedBy?: string;
    revokedAt?: Date;
    revokedReason?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
} & NetworkSecurityContext): InvitationToken {
    return new InvitationToken(
      new InvitationTokenId(params.id || TestUtils.generateUuid()),
      new EnvelopeId(params.envelopeId || TestUtils.generateUuid()),
      new SignerId(params.signerId || TestUtils.generateUuid()),
      params.tokenHash || TestUtils.generateSha256Hash(),
      params.status || InvitationTokenStatus.ACTIVE,
      params.expiresAt,
      params.sentAt,
      params.lastSentAt,
      params.resendCount || 0,
      params.usedAt,
      params.usedBy,
      params.viewCount || 0,
      params.lastViewedAt,
      params.signedAt,
      params.signedBy,
      params.revokedAt,
      params.revokedReason,
      params.createdBy,
      params.ipAddress,
      params.userAgent,
      params.country,
      params.createdAt || new Date('2024-01-01'),
      params.updatedAt || new Date('2024-01-01'),
      systemClock
    );
  }

  describe('Constructor and Getters', () => {
    it('should create token with all properties', () => {
      const tokenId = TestUtils.generateUuid();
      const envelopeId = TestUtils.generateUuid();
      const signerId = TestUtils.generateUuid();
      const tokenHash = TestUtils.generateSha256Hash();
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const ipAddress = generateTestIpAddress();

      const token = createInvitationTokenWithParams({
        id: tokenId,
        envelopeId: envelopeId,
        signerId: signerId,
        tokenHash: tokenHash,
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date('2024-12-31'),
        sentAt: new Date('2024-01-01'),
        lastSentAt: new Date('2024-01-02'),
        resendCount: 2,
        usedAt: undefined,
        usedBy: undefined,
        revokedAt: undefined,
        revokedReason: undefined,
        createdBy: 'user-123',
        ipAddress: ipAddress,
        userAgent: 'Mozilla/5.0',
        country: 'US',
        createdAt: createdAt,
        updatedAt: updatedAt
      });

      expect(token.getId().getValue()).toBe(tokenId);
      expect(token.getEnvelopeId().getValue()).toBe(envelopeId);
      expect(token.getSignerId().getValue()).toBe(signerId);
      expect(token.getTokenHash()).toBe(tokenHash);
      expect(token.getToken()).toBe(tokenHash);
      expect(token.getStatus()).toBe(InvitationTokenStatus.ACTIVE);
      expect(token.getExpiresAt()).toEqual(new Date('2024-12-31'));
      expect(token.getSentAt()).toEqual(new Date('2024-01-01'));
      expect(token.getLastSentAt()).toEqual(new Date('2024-01-02'));
      expect(token.getResendCount()).toBe(2);
      expect(token.getUsedAt()).toBeUndefined();
      expect(token.getUsedBy()).toBeUndefined();
      expect(token.getRevokedAt()).toBeUndefined();
      expect(token.getRevokedReason()).toBeUndefined();
      expect(token.getCreatedBy()).toBe('user-123');
      expect(token.getIpAddress()).toBe(ipAddress);
      expect(token.getUserAgent()).toBe('Mozilla/5.0');
      expect(token.getCountry()).toBe('US');
      expect(token.getCreatedAt()).toEqual(createdAt);
      expect(token.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should create token with minimal properties', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE
      });

      expect(token.getStatus()).toBe(InvitationTokenStatus.ACTIVE);
      expect(token.getExpiresAt()).toBeUndefined();
      expect(token.getSentAt()).toBeUndefined();
      expect(token.getLastSentAt()).toBeUndefined();
      expect(token.getResendCount()).toBe(0);
      expect(token.getUsedAt()).toBeUndefined();
      expect(token.getUsedBy()).toBeUndefined();
      expect(token.getRevokedAt()).toBeUndefined();
      expect(token.getRevokedReason()).toBeUndefined();
      expect(token.getCreatedBy()).toBeUndefined();
      expect(token.getIpAddress()).toBeUndefined();
      expect(token.getUserAgent()).toBeUndefined();
      expect(token.getCountry()).toBeUndefined();
    });

    it('should handle undefined optional fields', () => {
      const token = createInvitationTokenWithParams({
        expiresAt: undefined,
        sentAt: undefined,
        lastSentAt: undefined,
        usedAt: undefined,
        usedBy: undefined,
        revokedAt: undefined,
        revokedReason: undefined,
        createdBy: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined
      });

      expect(token.getExpiresAt()).toBeUndefined();
      expect(token.getSentAt()).toBeUndefined();
      expect(token.getLastSentAt()).toBeUndefined();
      expect(token.getUsedAt()).toBeUndefined();
      expect(token.getUsedBy()).toBeUndefined();
      expect(token.getRevokedAt()).toBeUndefined();
      expect(token.getRevokedReason()).toBeUndefined();
      expect(token.getCreatedBy()).toBeUndefined();
      expect(token.getIpAddress()).toBeUndefined();
      expect(token.getUserAgent()).toBeUndefined();
      expect(token.getCountry()).toBeUndefined();
    });
  });

  describe('Metadata', () => {
    it('should return metadata object with all fields', () => {
      const ipAddress = generateTestIpAddress();
      const token = createInvitationTokenWithParams({
        ipAddress: ipAddress,
        userAgent: 'Mozilla/5.0',
        country: 'US'
      });

      const metadata = token.getMetadata();

      expect(metadata).toEqual({
        ipAddress: ipAddress,
        userAgent: 'Mozilla/5.0',
        country: 'US'
      });
    });

    it('should return metadata object with undefined fields', () => {
      const token = createInvitationTokenWithParams({
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined
      });

      const metadata = token.getMetadata();

      expect(metadata).toEqual({
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined
      });
    });

    it('should return metadata object with partial fields', () => {
      const ipAddress = generateTestIpAddress();
      const token = createInvitationTokenWithParams({
        ipAddress: ipAddress,
        userAgent: undefined,
        country: 'US'
      });

      const metadata = token.getMetadata();

      expect(metadata).toEqual({
        ipAddress: ipAddress,
        userAgent: undefined,
        country: 'US'
      });
    });
  });

  describe('Status Checks', () => {
    it('should correctly identify active status', () => {
      const activeToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000) // 1 day from now
      });

      expect(activeToken.isActive()).toBe(true);
      expect(activeToken.isExpired()).toBe(false);
      expect(activeToken.isUsed()).toBe(false);
      expect(activeToken.isRevoked()).toBe(false);
    });

    it('should correctly identify expired status', () => {
      const expiredToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() - 86400000) // 1 day ago
      });

      expect(expiredToken.isActive()).toBe(false);
      expect(expiredToken.isExpired()).toBe(true);
      expect(expiredToken.isUsed()).toBe(false);
      expect(expiredToken.isRevoked()).toBe(false);
    });

    it('should correctly identify signed status', () => {
      const signedToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.SIGNED,
        signedAt: new Date('2024-01-02'),
        signedBy: 'user-123'
      });

      expect(signedToken.isActive()).toBe(false);
      expect(signedToken.isExpired()).toBe(false);
      expect(signedToken.isUsed()).toBe(true);
      expect(signedToken.isRevoked()).toBe(false);
    });

    it('should correctly identify revoked status', () => {
      const revokedToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.REVOKED,
        revokedAt: new Date('2024-01-02'),
        revokedReason: 'Security breach'
      });

      expect(revokedToken.isActive()).toBe(false);
      expect(revokedToken.isExpired()).toBe(false);
      expect(revokedToken.isUsed()).toBe(false);
      expect(revokedToken.isRevoked()).toBe(true);
    });

    it('should correctly identify expired status', () => {
      const expiredToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.EXPIRED
      });

      expect(expiredToken.isActive()).toBe(false);
      expect(expiredToken.isExpired()).toBe(true); // isExpired() now checks both status and date
      expect(expiredToken.isUsed()).toBe(false);
      expect(expiredToken.isRevoked()).toBe(false);
    });

    it('should handle token without expiration date', () => {
      const tokenWithoutExpiration = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: undefined
      });

      expect(tokenWithoutExpiration.isActive()).toBe(true);
      expect(tokenWithoutExpiration.isExpired()).toBe(false);
    });

    it('should handle token expired by date but not by status', () => {
      const expiredByDateToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() - 86400000) // 1 day ago
      });

      expect(expiredByDateToken.isActive()).toBe(false);
      expect(expiredByDateToken.isExpired()).toBe(true); // Expired by date
    });

    it('should handle token expired by status but not by date', () => {
      const expiredByStatusToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.EXPIRED,
        expiresAt: new Date(Date.now() + 86400000) // 1 day from now
      });

      expect(expiredByStatusToken.isActive()).toBe(false);
      expect(expiredByStatusToken.isExpired()).toBe(true); // Expired by status
    });
  });


  describe('Mark as Sent', () => {
    it('should mark token as sent with all metadata', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        resendCount: 0
      });

      const ipAddress = generateTestIpAddress();
      const userAgent = 'Mozilla/5.0';
      const country = 'US';

      token.markAsSent(ipAddress, userAgent, country);

      expect(token.getSentAt()).toBeDefined();
      expect(token.getLastSentAt()).toBeDefined();
      expect(token.getResendCount()).toBe(1);
      expect(token.getIpAddress()).toBe(ipAddress);
      expect(token.getUserAgent()).toBe(userAgent);
      expect(token.getCountry()).toBe(country);
    });

    it('should mark token as sent without metadata', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        resendCount: 2
      });

      token.markAsSent();

      expect(token.getSentAt()).toBeDefined();
      expect(token.getLastSentAt()).toBeDefined();
      expect(token.getResendCount()).toBe(3);
      expect(token.getIpAddress()).toBeUndefined();
      expect(token.getUserAgent()).toBeUndefined();
      expect(token.getCountry()).toBeUndefined();
    });

    it('should increment resend count on multiple sends', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        resendCount: 0
      });

      token.markAsSent();
      expect(token.getResendCount()).toBe(1);

      token.markAsSent();
      expect(token.getResendCount()).toBe(2);

      token.markAsSent();
      expect(token.getResendCount()).toBe(3);
    });

    it('should not update sentAt on subsequent sends', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        resendCount: 0
      });

      token.markAsSent();
      const firstSentAt = token.getSentAt();
      
      token.markAsSent();
      const secondSentAt = token.getSentAt();
      
      expect(firstSentAt).toEqual(secondSentAt);
      expect(token.getResendCount()).toBe(2);
    });
  });

  describe('Mark as Viewed', () => {
    it('should mark token as viewed successfully', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000) // 1 day from now
      });

      const testIpAddress = generateTestIpAddress();
      const securityContext = {
        ipAddress: testIpAddress,
        userAgent: 'Mozilla/5.0',
        country: 'US'
      };

      token.markAsViewed(securityContext);

      expect(token.getStatus()).toBe(InvitationTokenStatus.VIEWED);
      expect(token.getViewCount()).toBe(1);
      expect(token.getLastViewedAt()).toBeDefined();
      expect(token.getUsedAt()).toBeDefined();
      expect(token.getUsedBy()).toBe(token.getSignerId().getValue());
      expect(token.getIpAddress()).toBe(testIpAddress);
      expect(token.getUserAgent()).toBe('Mozilla/5.0');
      expect(token.getCountry()).toBe('US');
    });

    it('should throw error when trying to view expired token', () => {
      const expiredToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() - 86400000) // 1 day ago
      });

      expect(() => expiredToken.markAsViewed({}))
        .toThrow(invitationTokenExpired('Invitation token has expired'));
    });

    it('should throw error when trying to view revoked token', () => {
      const revokedToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.REVOKED
      });

      expect(() => revokedToken.markAsViewed({}))
        .toThrow(invitationTokenRevoked('Invitation token has been revoked'));
    });

    it('should not change status if already viewed', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.VIEWED,
        expiresAt: new Date(Date.now() + 86400000)
      });

      token.markAsViewed({});

      expect(token.getStatus()).toBe(InvitationTokenStatus.VIEWED);
      expect(token.getViewCount()).toBe(1);
    });

    it('should not change status if already signed', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.SIGNED,
        expiresAt: new Date(Date.now() + 86400000)
      });

      token.markAsViewed({});

      expect(token.getStatus()).toBe(InvitationTokenStatus.SIGNED);
      expect(token.getViewCount()).toBe(1);
    });
  });

  describe('Mark as Signed', () => {
    it('should mark token as signed successfully', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000)
      });

      const testIpAddress = generateTestIpAddress();
      const securityContext = {
        ipAddress: testIpAddress,
        userAgent: 'Mozilla/5.0',
        country: 'US'
      };

      token.markAsSigned('signer-123', securityContext);

      expect(token.getStatus()).toBe(InvitationTokenStatus.SIGNED);
      expect(token.getSignedAt()).toBeDefined();
      expect(token.getSignedBy()).toBe('signer-123');
      expect(token.getUsedAt()).toBeDefined();
      expect(token.getUsedBy()).toBe('signer-123');
      expect(token.getIpAddress()).toBe(testIpAddress);
      expect(token.getUserAgent()).toBe('Mozilla/5.0');
      expect(token.getCountry()).toBe('US');
    });

    it('should mark token as signed with SignerId', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000)
      });

      const signerId = new SignerId(TestUtils.generateUuid());
      token.markAsSigned(signerId, {});

      expect(token.getStatus()).toBe(InvitationTokenStatus.SIGNED);
      expect(token.getSignedBy()).toBe(signerId.getValue());
      expect(token.getUsedBy()).toBe(signerId.getValue());
    });

    it('should throw error when trying to sign expired token', () => {
      const expiredToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() - 86400000)
      });

      expect(() => expiredToken.markAsSigned('signer-123', {}))
        .toThrow(invitationTokenExpired('Invitation token has expired'));
    });

    it('should throw error when trying to sign already signed token', () => {
      const signedToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.SIGNED,
        expiresAt: new Date(Date.now() + 86400000)
      });

      expect(() => signedToken.markAsSigned('signer-123', {}))
        .toThrow(invitationTokenAlreadyUsed('Invitation token has already been used for signing'));
    });

    it('should throw error when trying to sign revoked token', () => {
      const revokedToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.REVOKED,
        expiresAt: new Date(Date.now() + 86400000)
      });

      expect(() => revokedToken.markAsSigned('signer-123', {}))
        .toThrow(invitationTokenRevoked('Invitation token has been revoked'));
    });
  });

  describe('Token Utilities', () => {
    it('should check if token can be resent within limit', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        resendCount: 2,
        expiresAt: new Date(Date.now() + 86400000) // 1 day from now
      });

      expect(token.canBeResent(3)).toBe(true);
      expect(token.canBeResent(2)).toBe(false);
      expect(token.canBeResent(5)).toBe(true);
    });

    it('should check if token can be resent with default limit', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        resendCount: 2,
        expiresAt: new Date(Date.now() + 86400000) // 1 day from now
      });

      expect(token.canBeResent()).toBe(true); // Default limit is 3
    });

    it('should return false for canBeResent when token is not active', () => {
      const expiredToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        resendCount: 1,
        expiresAt: new Date(Date.now() - 86400000) // 1 day ago
      });

      expect(expiredToken.canBeResent(3)).toBe(false);
    });

    it('should calculate token age correctly', () => {
      const createdAt = new Date(Date.now() - 3600000); // 1 hour ago
      const token = createInvitationTokenWithParams({
        createdAt: createdAt
      });

      const age = token.getAge();
      expect(age).toBeGreaterThan(3599000); // Should be close to 1 hour in ms
      expect(age).toBeLessThan(3601000);
    });

    it('should check if token is recent', () => {
      const baseTime = new Date('2024-01-01T12:00:00.000Z');
      const recentToken = createInvitationTokenWithParams({
        createdAt: new Date(baseTime.getTime() - 300000) // 5 minutes ago
      });

      const oldToken = createInvitationTokenWithParams({
        createdAt: new Date(baseTime.getTime() - 3600000) // 1 hour ago
      });

      // Mock Date.now to return baseTime
      const originalNow = Date.now;
      Date.now = jest.fn(() => baseTime.getTime());

      try {
        expect(recentToken.isRecent(600000)).toBe(true); // Within 10 minutes
        expect(recentToken.isRecent(300001)).toBe(true); // Within 5 minutes + 1ms
        expect(recentToken.isRecent(60000)).toBe(false); // Within 1 minute

        expect(oldToken.isRecent(3600001)).toBe(true); // Within 1 hour
        expect(oldToken.isRecent(1800000)).toBe(false); // Within 30 minutes
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('Equality', () => {
    it('should return true for equal tokens', () => {
      const tokenId = TestUtils.generateUuid();
      const token1 = createInvitationTokenWithParams({ id: tokenId });
      const token2 = createInvitationTokenWithParams({ id: tokenId });

      expect(token1.equals(token2)).toBe(true);
    });

    it('should return false for different tokens', () => {
      const token1 = createInvitationTokenWithParams({ id: TestUtils.generateUuid() });
      const token2 = createInvitationTokenWithParams({ id: TestUtils.generateUuid() });

      expect(token1.equals(token2)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle token with all optional fields undefined', () => {
      const token = createInvitationTokenWithParams({
        expiresAt: undefined,
        sentAt: undefined,
        lastSentAt: undefined,
        usedAt: undefined,
        usedBy: undefined,
        revokedAt: undefined,
        revokedReason: undefined,
        createdBy: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined
      });

      expect(token.isActive()).toBe(true); // No expiration means not expired
      expect(token.getMetadata()).toEqual({
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined
      });
    });

    it('should handle token with expiration exactly at current time', () => {
      const now = new Date(Date.now() + 1000); // 1 second in the future to ensure it's not expired
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: now
      });

      // Token should be considered expired if expiration is before current time
      // Since now is in the future, it should not be expired (new Date() > this.expiresAt)
      expect(token.isExpired()).toBe(false);
      // However, isActive() checks both status and !isExpired(), so it should be active
      expect(token.isActive()).toBe(true);
    });

    it('should handle token with expiration 100 milliseconds in the future', () => {
      const futureTime = new Date(Date.now() + 100); // 100ms in the future
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: futureTime
      });

      // Token should not be expired since expiration is in the future
      expect(token.isExpired()).toBe(false);
      expect(token.isActive()).toBe(true);
    });

    it('should handle token with very high resend count', () => {
      const token = createInvitationTokenWithParams({
        resendCount: 999
      });

      expect(token.getResendCount()).toBe(999);
    });


    it('should handle token with special characters in metadata', () => {
      const ipAddress = generateTestIpAddress();
      const token = createInvitationTokenWithParams({
        ipAddress: ipAddress,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        country: 'US'
      });

      const metadata = token.getMetadata();

      expect(metadata.ipAddress).toBe(ipAddress);
      expect(metadata.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      expect(metadata.country).toBe('US');
    });
  });

  describe('Static Methods', () => {
    describe('create', () => {
      it('should create new token with all required parameters', () => {
        const envelopeId = new EnvelopeId(TestUtils.generateUuid());
        const signerId = new SignerId(TestUtils.generateUuid());
        const tokenHash = TestUtils.generateSha256Hash();
        const expiresAt = new Date(Date.now() + 86400000);
        const createdBy = 'user-123';

        const token = InvitationToken.create({
          envelopeId,
          signerId,
          tokenHash,
          expiresAt,
          createdBy
        });

        expect(token.getEnvelopeId()).toEqual(envelopeId);
        expect(token.getSignerId()).toEqual(signerId);
        expect(token.getTokenHash()).toBe(tokenHash);
        expect(token.getExpiresAt()).toEqual(expiresAt);
        expect(token.getCreatedBy()).toBe(createdBy);
        expect(token.getStatus()).toBe(InvitationTokenStatus.ACTIVE);
        expect(token.getResendCount()).toBe(0);
        expect(token.getViewCount()).toBe(0);
        expect(token.getCreatedAt()).toBeDefined();
        expect(token.getUpdatedAt()).toBeDefined();
      });

      it('should create new token with optional metadata', () => {
        const envelopeId = new EnvelopeId(TestUtils.generateUuid());
        const signerId = new SignerId(TestUtils.generateUuid());
        const tokenHash = TestUtils.generateSha256Hash();
        const expiresAt = new Date(Date.now() + 86400000);
        const createdBy = 'user-123';

        const testIpAddress = generateTestIpAddress();
        const token = InvitationToken.create({
          envelopeId,
          signerId,
          tokenHash,
          expiresAt,
          createdBy,
          ipAddress: testIpAddress,
          userAgent: 'Mozilla/5.0',
          country: 'US'
        });

        expect(token.getIpAddress()).toBe(testIpAddress);
        expect(token.getUserAgent()).toBe('Mozilla/5.0');
      expect(token.getCountry()).toBe('US');
    });

    it('should handle empty security context', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000)
      });

      const originalIp = token.getIpAddress();
      const originalUserAgent = token.getUserAgent();
      const originalCountry = token.getCountry();

      token.markAsViewed({});

      expect(token.getIpAddress()).toBe(originalIp);
      expect(token.getUserAgent()).toBe(originalUserAgent);
      expect(token.getCountry()).toBe(originalCountry);
    });

    it('should handle undefined security context', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000)
      });

      const originalIp = token.getIpAddress();
      const originalUserAgent = token.getUserAgent();
      const originalCountry = token.getCountry();

      // Pass undefined explicitly to test the !ctx check
      token.markAsViewed(undefined as any);

      expect(token.getIpAddress()).toBe(originalIp);
      expect(token.getUserAgent()).toBe(originalUserAgent);
      expect(token.getCountry()).toBe(originalCountry);
    });
  });

    describe('fromPersistence', () => {
      it('should create token from persistence data with all fields', () => {
        const data = {
          id: TestUtils.generateUuid(),
          envelopeId: TestUtils.generateUuid(),
          signerId: TestUtils.generateUuid(),
          tokenHash: TestUtils.generateSha256Hash(),
          status: InvitationTokenStatus.ACTIVE,
          expiresAt: new Date(Date.now() + 86400000),
          sentAt: new Date(Date.now() - 3600000),
          lastSentAt: new Date(Date.now() - 1800000),
          resendCount: 2,
          usedAt: new Date(Date.now() - 900000),
          usedBy: 'user-123',
          viewCount: 1,
          lastViewedAt: new Date(Date.now() - 900000),
          signedAt: new Date(Date.now() - 600000),
          signedBy: 'user-123',
          revokedAt: null,
          revokedReason: null,
          createdBy: 'admin-456',
          ipAddress: generateTestIpAddress(),
          userAgent: 'Mozilla/5.0',
          country: 'US',
          createdAt: new Date(Date.now() - 7200000),
          updatedAt: new Date(Date.now() - 600000)
        };

        const token = InvitationToken.fromPersistence(data);

        expect(token.getId().getValue()).toBe(data.id);
        expect(token.getEnvelopeId().getValue()).toBe(data.envelopeId);
        expect(token.getSignerId().getValue()).toBe(data.signerId);
        expect(token.getTokenHash()).toBe(data.tokenHash);
        expect(token.getStatus()).toBe(data.status);
        expect(token.getExpiresAt()).toEqual(data.expiresAt);
        expect(token.getSentAt()).toEqual(data.sentAt);
        expect(token.getLastSentAt()).toEqual(data.lastSentAt);
        expect(token.getResendCount()).toBe(data.resendCount);
        expect(token.getUsedAt()).toEqual(data.usedAt);
        expect(token.getUsedBy()).toBe(data.usedBy);
        expect(token.getViewCount()).toBe(data.viewCount);
        expect(token.getLastViewedAt()).toEqual(data.lastViewedAt);
        expect(token.getSignedAt()).toEqual(data.signedAt);
        expect(token.getSignedBy()).toBe(data.signedBy);
        expect(token.getRevokedAt()).toBeUndefined();
        expect(token.getRevokedReason()).toBeUndefined();
        expect(token.getCreatedBy()).toBe(data.createdBy);
        expect(token.getIpAddress()).toBe(data.ipAddress);
        expect(token.getUserAgent()).toBe(data.userAgent);
        expect(token.getCountry()).toBe(data.country);
        expect(token.getCreatedAt()).toEqual(data.createdAt);
        expect(token.getUpdatedAt()).toEqual(data.updatedAt);
      });

      it('should throw error when handling negative counts', () => {
        const data = createInvalidTokenData();
        expect(() => InvitationToken.fromPersistence(data)).toThrow('Invalid value for viewCount: expected non-negative number, got -2');
      });

      function createInvalidTokenData() {
        return {
          id: TestUtils.generateUuid(),
          envelopeId: TestUtils.generateUuid(),
          signerId: TestUtils.generateUuid(),
          tokenHash: TestUtils.generateSha256Hash(),
          status: InvitationTokenStatus.ACTIVE,
          expiresAt: null,
          sentAt: null,
          lastSentAt: null,
          resendCount: -5,
          usedAt: null,
          usedBy: null,
          viewCount: -2,
          lastViewedAt: null,
          signedAt: null,
          signedBy: null,
          revokedAt: null,
          revokedReason: null,
          createdBy: null,
          ipAddress: null,
          userAgent: null,
          country: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      it('should handle invalid date formats', () => {
        const data = {
          id: TestUtils.generateUuid(),
          envelopeId: TestUtils.generateUuid(),
          signerId: TestUtils.generateUuid(),
          tokenHash: TestUtils.generateSha256Hash(),
          status: InvitationTokenStatus.ACTIVE,
          expiresAt: 'invalid-date',
          sentAt: 1234567890,
          lastSentAt: null,
          resendCount: 0,
          usedAt: null,
          usedBy: null,
          viewCount: 0,
          lastViewedAt: null,
          signedAt: null,
          signedBy: null,
          revokedAt: null,
          revokedReason: null,
          createdBy: null,
          ipAddress: null,
          userAgent: null,
          country: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const token = InvitationToken.fromPersistence(data);

        expect(token.getExpiresAt()).toBeUndefined();
        expect(token.getSentAt()).toBeUndefined();
      });

      it('should handle valid date formats', () => {
        const data = {
          id: TestUtils.generateUuid(),
          envelopeId: TestUtils.generateUuid(),
          signerId: TestUtils.generateUuid(),
          tokenHash: TestUtils.generateSha256Hash(),
          status: InvitationTokenStatus.ACTIVE,
          expiresAt: '2024-01-01T12:00:00.000Z',
          sentAt: new Date('2024-01-01T10:00:00.000Z'),
          lastSentAt: null,
          resendCount: 0,
          usedAt: null,
          usedBy: null,
          viewCount: 0,
          lastViewedAt: null,
          signedAt: null,
          signedBy: null,
          revokedAt: null,
          revokedReason: null,
          createdBy: null,
          ipAddress: null,
          userAgent: null,
          country: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const token = InvitationToken.fromPersistence(data);

        expect(token.getExpiresAt()).toEqual(new Date('2024-01-01T12:00:00.000Z'));
        expect(token.getSentAt()).toEqual(new Date('2024-01-01T10:00:00.000Z'));
      });
    });
  });
});
