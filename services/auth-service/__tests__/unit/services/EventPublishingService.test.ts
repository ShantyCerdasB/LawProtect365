/**
 * @fileoverview EventPublishingService Tests - Comprehensive unit tests for EventPublishingService
 * @summary Tests all event publishing methods with full coverage
 * @description This test suite provides comprehensive coverage of EventPublishingService including
 * all event publishing methods, error handling, and edge cases.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { EventPublishingService } from '../../../src/services/EventPublishingService';
import { IntegrationEventPublisher } from '@lawprotect/shared-ts';
import { userEntity } from '../../helpers/builders/user';

describe('EventPublishingService', () => {
  let eventPublishingService: EventPublishingService;
  let mockEventPublisher: jest.Mocked<IntegrationEventPublisher>;

  beforeEach(() => {
    const mockPublish = jest.fn();
    (mockPublish as any).mockResolvedValue(undefined);
    mockEventPublisher = {
      publish: mockPublish
    } as any;
    eventPublishingService = new EventPublishingService(mockEventPublisher);
    jest.clearAllMocks();
  });

  describe('publishUserRegistered', () => {
    it('publishes user registered event', async () => {
      const user = userEntity();
      await eventPublishingService.publishUserRegistered(user);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UserRegistered',
          source: 'auth-service'
        }),
        expect.any(String)
      );
    });

    it('includes metadata when provided', async () => {
      const user = userEntity();
      const metadata = { source: 'test' };
      await eventPublishingService.publishUserRegistered(user, metadata);
      expect(mockEventPublisher.publish).toHaveBeenCalled();
    });

    it('includes additionalData in event data', async () => {
      const user = userEntity();
      const additionalData = { customField: 'value' };
      await eventPublishingService.publishUserRegistered(user, additionalData);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UserRegistered',
          source: 'auth-service',
          data: expect.objectContaining({
            customField: 'value'
          })
        }),
        expect.any(String)
      );
    });
  });

  describe('publishUserUpdated', () => {
    it('publishes user updated event', async () => {
      const user = userEntity();
      await eventPublishingService.publishUserUpdated(user);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UserUpdated',
          source: 'auth-service'
        }),
        expect.any(String)
      );
    });
  });

  describe('publishUserRoleChanged', () => {
    it('publishes user role changed event', async () => {
      const user = userEntity();
      const oldRole = 'UNASSIGNED';
      const newRole = 'LAWYER';
      await eventPublishingService.publishUserRoleChanged(user, oldRole, newRole);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UserRoleChanged',
          source: 'auth-service',
          data: expect.objectContaining({
            oldRole,
            newRole
          })
        }),
        expect.any(String)
      );
    });
  });

  describe('publishUserStatusChanged', () => {
    it('publishes user status changed event', async () => {
      const user = userEntity();
      const oldStatus = 'ACTIVE';
      const newStatus = 'SUSPENDED';
      await eventPublishingService.publishUserStatusChanged(user, oldStatus, newStatus);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UserStatusChanged',
          source: 'auth-service',
          data: expect.objectContaining({
            oldStatus,
            newStatus
          })
        }),
        expect.any(String)
      );
    });
  });

  describe('publishMfaStatusChanged', () => {
    it('publishes MFA status changed event', async () => {
      const user = userEntity();
      const mfaEnabled = true;
      await eventPublishingService.publishMfaStatusChanged(user, mfaEnabled);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MfaStatusChanged',
          source: 'auth-service',
          data: expect.objectContaining({
            mfaEnabled
          })
        }),
        expect.any(String)
      );
    });
  });

  describe('publishOAuthAccountLinked', () => {
    it('publishes OAuth account linked event', async () => {
      const user = userEntity();
      const provider = 'Google';
      const providerAccountId = 'provider-123';
      await eventPublishingService.publishOAuthAccountLinked(user, provider, providerAccountId);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'OAuthAccountLinked',
          source: 'auth-service',
          data: expect.objectContaining({
            provider,
            providerAccountId
          })
        }),
        expect.any(String)
      );
    });
  });

  describe('publishOAuthAccountUnlinked', () => {
    it('publishes OAuth account unlinked event', async () => {
      const user = userEntity();
      const provider = 'Google';
      const providerAccountId = 'provider-123';
      await eventPublishingService.publishOAuthAccountUnlinked(user, provider, providerAccountId);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'OAuthAccountUnlinked',
          source: 'auth-service',
          data: expect.objectContaining({
            provider,
            providerAccountId
          })
        }),
        expect.any(String)
      );
    });
  });

  describe('publishCustomEvent', () => {
    it('publishes custom event with data', async () => {
      const eventType = 'CustomEvent';
      const eventData = { customField: 'value' };
      await eventPublishingService.publishCustomEvent(eventType, eventData);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: eventType,
          source: 'auth-service',
          data: expect.objectContaining({
            customField: 'value',
            timestamp: expect.any(String)
          })
        }),
        undefined
      );
    });

    it('publishes custom event with dedupId', async () => {
      const eventType = 'CustomEvent';
      const eventData = { customField: 'value' };
      const dedupId = 'dedup-123';
      await eventPublishingService.publishCustomEvent(eventType, eventData, dedupId);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: eventType,
          source: 'auth-service'
        }),
        dedupId
      );
    });

    it('handles publish errors gracefully', async () => {
      const eventType = 'CustomEvent';
      const eventData = { customField: 'value' };
      mockEventPublisher.publish.mockRejectedValue(new Error('Publish failed'));
      await expect(eventPublishingService.publishCustomEvent(eventType, eventData)).resolves.not.toThrow();
    });
  });

  describe('publishUserProviderLinked', () => {
    it('publishes user provider linked event', async () => {
      const user = userEntity();
      const identity = {
        provider: 'Google',
        providerAccountId: 'provider-123',
        email: 'user@example.com',
        name: 'John Doe'
      };
      await eventPublishingService.publishUserProviderLinked(user, identity);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UserProviderLinked',
          source: 'auth-service',
          data: expect.objectContaining({
            provider: identity.provider,
            providerAccountId: identity.providerAccountId,
            providerEmail: identity.email,
            providerName: identity.name
          })
        }),
        expect.any(String)
      );
    });
  });

  describe('publishUserProviderUnlinked', () => {
    it('publishes user provider unlinked event', async () => {
      const user = userEntity();
      const provider = 'Google';
      const providerAccountId = 'provider-123';
      await eventPublishingService.publishUserProviderUnlinked(user, provider, providerAccountId);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UserProviderUnlinked',
          source: 'auth-service',
          data: expect.objectContaining({
            provider,
            providerAccountId
          })
        }),
        expect.any(String)
      );
    });
  });

  describe('error handling', () => {
    it('handles publish errors gracefully in publishUserEvent', async () => {
      const user = userEntity();
      mockEventPublisher.publish.mockRejectedValue(new Error('Publish failed'));
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      await expect(eventPublishingService.publishUserRegistered(user)).resolves.not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('handles string error in publishUserEvent', async () => {
      const user = userEntity();
      mockEventPublisher.publish.mockRejectedValue('String error');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      await expect(eventPublishingService.publishUserUpdated(user)).resolves.not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('handles publish errors gracefully in publishCustomEvent', async () => {
      const eventType = 'CustomEvent';
      const eventData = { customField: 'value' };
      mockEventPublisher.publish.mockRejectedValue(new Error('Publish failed'));
      await expect(eventPublishingService.publishCustomEvent(eventType, eventData)).resolves.not.toThrow();
    });
  });
});

