/**
 * @fileoverview InvitationToken Entity Unit Tests
 * @summary Comprehensive test suite for InvitationToken entity with 100% coverage
 * @description Tests all business logic, state transitions, validations, and edge cases
 * for the InvitationToken entity that manages invitation tokens for external signer access.
 */

import { InvitationToken } from '../../../../src/domain/entities/InvitationToken';
import { InvitationTokenId } from '../../../../src/domain/value-objects/InvitationTokenId';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { SignerId } from '../../../../src/domain/value-objects/SignerId';
import { InvitationTokenStatus } from '@prisma/client';
import { TestUtils } from '../../../helpers/testUtils';
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
    revokedAt?: Date;
    revokedReason?: string;
    createdBy?: string;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): InvitationToken {
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
      params.revokedAt,
      params.revokedReason,
      params.createdBy,
      params.ipAddress,
      params.userAgent,
      params.country,
      params.createdAt || new Date('2024-01-01'),
      params.updatedAt || new Date('2024-01-01')
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
        ipAddress: '192.168.1.1',
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
      expect(token.getIpAddress()).toBe('192.168.1.1');
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
      const token = createInvitationTokenWithParams({
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        country: 'US'
      });

      const metadata = token.getMetadata();

      expect(metadata).toEqual({
        ipAddress: '192.168.1.1',
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
      const token = createInvitationTokenWithParams({
        ipAddress: '192.168.1.1',
        userAgent: undefined,
        country: 'US'
      });

      const metadata = token.getMetadata();

      expect(metadata).toEqual({
        ipAddress: '192.168.1.1',
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

    it('should correctly identify used status', () => {
      const usedToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.USED,
        usedAt: new Date('2024-01-02'),
        usedBy: 'user-123'
      });

      expect(usedToken.isActive()).toBe(false);
      expect(usedToken.isExpired()).toBe(false);
      expect(usedToken.isUsed()).toBe(true);
      expect(usedToken.isRevoked()).toBe(false);
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

  describe('Mark as Used', () => {
    it('should mark token as used successfully', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000) // 1 day from now
      });

      const usedBy = 'user-123';

      token.markAsUsed(usedBy);

      expect(token.getStatus()).toBe(InvitationTokenStatus.USED);
      expect(token.getUsedAt()).toBeDefined();
      expect(token.getUsedBy()).toBe(usedBy);
    });

    it('should throw error when trying to use expired token', () => {
      const expiredToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() - 86400000) // 1 day ago
      });

      expect(() => expiredToken.markAsUsed('user-123'))
        .toThrow(invitationTokenExpired('Invitation token has expired'));
    });

    it('should throw error when trying to use already used token', () => {
      const usedToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.USED
      });

      expect(() => usedToken.markAsUsed('user-123'))
        .toThrow(invitationTokenAlreadyUsed('Invitation token has already been used'));
    });

    it('should throw error when trying to use revoked token', () => {
      const revokedToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.REVOKED
      });

      expect(() => revokedToken.markAsUsed('user-123'))
        .toThrow(invitationTokenRevoked('Invitation token has been revoked'));
    });

    it('should throw error when trying to use expired status token', () => {
      const expiredToken = createInvitationTokenWithParams({
        status: InvitationTokenStatus.EXPIRED
      });

      // EXPIRED status token should throw error in markAsUsed since isExpired() now checks status
      expect(() => expiredToken.markAsUsed('user-123'))
        .toThrow(invitationTokenExpired('Invitation token has expired'));
    });
  });

  describe('Mark as Sent', () => {
    it('should mark token as sent with all metadata', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE,
        resendCount: 0
      });

      const ipAddress = '192.168.1.1';
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
  });

  describe('Revoke Token', () => {
    it('should revoke token successfully', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE
      });

      const reason = 'Security breach';
      const revokedBy = 'admin-123';

      token.revoke(reason, revokedBy);

      expect(token.getStatus()).toBe(InvitationTokenStatus.REVOKED);
      expect(token.getRevokedAt()).toBeDefined();
      expect(token.getRevokedReason()).toBe(reason);
    });

    it('should revoke token with empty reason', () => {
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE
      });

      token.revoke('', 'admin-123');

      expect(token.getStatus()).toBe(InvitationTokenStatus.REVOKED);
      expect(token.getRevokedAt()).toBeDefined();
      expect(token.getRevokedReason()).toBe('');
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
      const recentToken = createInvitationTokenWithParams({
        createdAt: new Date(Date.now() - 300000) // 5 minutes ago
      });

      const oldToken = createInvitationTokenWithParams({
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
      });

      expect(recentToken.isRecent(600000)).toBe(true); // Within 10 minutes
      expect(recentToken.isRecent(300001)).toBe(true); // Within 5 minutes + 1ms
      expect(recentToken.isRecent(60000)).toBe(false); // Within 1 minute

      expect(oldToken.isRecent(3600001)).toBe(true); // Within 1 hour
      expect(oldToken.isRecent(1800000)).toBe(false); // Within 30 minutes
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

    it('should handle token with expiration 1 millisecond in the future', () => {
      const futureTime = new Date(Date.now() + 1); // 1ms in the future
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

    it('should handle token with long reason text', () => {
      const longReason = 'This is a very long reason for revoking the token that exceeds normal length limits and should still be handled properly by the system';
      const token = createInvitationTokenWithParams({
        status: InvitationTokenStatus.ACTIVE
      });

      token.revoke(longReason, 'admin-123');

      expect(token.getRevokedReason()).toBe(longReason);
    });

    it('should handle token with special characters in metadata', () => {
      const token = createInvitationTokenWithParams({
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        country: 'US'
      });

      const metadata = token.getMetadata();

      expect(metadata.ipAddress).toBe('192.168.1.1');
      expect(metadata.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      expect(metadata.country).toBe('US');
    });
  });
});
