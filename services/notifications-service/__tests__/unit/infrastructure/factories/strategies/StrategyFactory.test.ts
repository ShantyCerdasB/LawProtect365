/**
 * @fileoverview StrategyFactory Tests - Unit tests for StrategyFactory
 * @summary Tests for strategy factory creation and registration
 * @description Comprehensive test suite for StrategyFactory covering strategy registry
 * creation and registration of all event processing strategies.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { StrategyFactory } from '../../../../../src/infrastructure/factories/strategies/StrategyFactory';
import { StrategyRegistry } from '../../../../../src/domain/strategies';
import { TranslationService } from '../../../../../src/services/i18n';
import { AuthServiceEventType } from '../../../../../src/domain/enums';

describe('StrategyFactory', () => {
  let mockTranslationService: TranslationService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTranslationService = {
      translate: jest.fn(),
      translateWithContext: jest.fn(),
    } as any;
  });

  describe('createRegistry', () => {
    it('should create a StrategyRegistry instance', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register all signature service strategies', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register all auth service strategies', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register strategies with translation service', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register EnvelopeInvitationStrategy', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register DocumentViewInvitationStrategy', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register SignerDeclinedStrategy', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register EnvelopeCancelledStrategy', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register ReminderNotificationStrategy', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register UserRegisteredStrategy', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register AuthServiceEventStrategy with all event types', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register AuthServiceEventStrategy with USER_UPDATED event type', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register AuthServiceEventStrategy with USER_ROLE_CHANGED event type', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register AuthServiceEventStrategy with USER_STATUS_CHANGED event type', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register AuthServiceEventStrategy with MFA_STATUS_CHANGED event type', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register AuthServiceEventStrategy with OAUTH_ACCOUNT_LINKED event type', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register AuthServiceEventStrategy with OAUTH_ACCOUNT_UNLINKED event type', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register AuthServiceEventStrategy with USER_PROVIDER_LINKED event type', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });

    it('should register AuthServiceEventStrategy with USER_PROVIDER_UNLINKED event type', () => {
      const registry = StrategyFactory.createRegistry(mockTranslationService);

      expect(registry).toBeInstanceOf(StrategyRegistry);
    });
  });
});

