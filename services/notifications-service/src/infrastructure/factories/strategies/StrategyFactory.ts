/**
 * @fileoverview StrategyFactory - Factory for creating event processing strategies
 * @summary Creates and registers all event processing strategies
 * @description This factory creates all event processing strategies and registers
 * them with the StrategyRegistry. It follows the Single Responsibility Principle
 * by focusing exclusively on strategy creation and registration.
 */

import { StrategyRegistry } from '../../../domain/strategies';
import { TranslationService } from '../../../services/i18n';
import {
  EnvelopeInvitationStrategy,
  DocumentViewInvitationStrategy,
  SignerDeclinedStrategy,
  EnvelopeCancelledStrategy,
  ReminderNotificationStrategy
} from '../../../domain/strategies/signature-service';
import {
  UserRegisteredStrategy,
  AuthServiceEventStrategy
} from '../../../domain/strategies/auth-service';
import { AuthServiceEventType } from '../../../domain/enums';

/**
 * Factory responsible for creating and registering all event processing strategies.
 * Follows the Single Responsibility Principle by focusing exclusively on strategy creation.
 */
export class StrategyFactory {
  /**
   * @description Creates a StrategyRegistry with all strategies registered
   * @param {TranslationService} translationService - Translation service for i18n
   * @returns {StrategyRegistry} Configured StrategyRegistry with all strategies
   */
  static createRegistry(translationService: TranslationService): StrategyRegistry {
    const registry = new StrategyRegistry();

    const signatureStrategies = [
      new EnvelopeInvitationStrategy(translationService),
      new DocumentViewInvitationStrategy(translationService),
      new SignerDeclinedStrategy(translationService),
      new EnvelopeCancelledStrategy(translationService),
      new ReminderNotificationStrategy(translationService)
    ];

    const authStrategies = [
      new UserRegisteredStrategy(translationService),
      new AuthServiceEventStrategy(translationService, [
        AuthServiceEventType.USER_UPDATED,
        AuthServiceEventType.USER_ROLE_CHANGED,
        AuthServiceEventType.USER_STATUS_CHANGED,
        AuthServiceEventType.MFA_STATUS_CHANGED,
        AuthServiceEventType.OAUTH_ACCOUNT_LINKED,
        AuthServiceEventType.OAUTH_ACCOUNT_UNLINKED,
        AuthServiceEventType.USER_PROVIDER_LINKED,
        AuthServiceEventType.USER_PROVIDER_UNLINKED
      ])
    ];

    registry.registerAll([...signatureStrategies, ...authStrategies]);

    return registry;
  }
}

