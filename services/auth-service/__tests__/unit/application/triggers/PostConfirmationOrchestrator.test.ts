/**
 * @fileoverview PostConfirmationOrchestrator Tests - Unit tests for PostConfirmationOrchestrator
 * @summary Tests for PostConfirmation orchestrator
 * @description Tests all methods in PostConfirmationOrchestrator including user registration, provider linking, and audit events.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { PostConfirmationOrchestrator } from '../../../../src/application/triggers/PostConfirmationOrchestrator';
import { UserService } from '../../../../src/services/UserService';
import { CognitoService } from '../../../../src/services/CognitoService';
import { AuditService } from '../../../../src/services/AuditService';
import { EventPublishingService } from '../../../../src/services/EventPublishingService';
import { Logger } from '@lawprotect/shared-ts';
import { PostConfirmationEventBuilder } from '../../../helpers/builders';
import { userEntity } from '../../../helpers/builders/user';
import { CognitoSub } from '../../../../src/domain/value-objects/CognitoSub';
import { UserRole, CognitoAttribute, OAuthProvider } from '../../../../src/domain/enums';
import { AuthServiceConfig } from '../../../../src/config/AppConfig';
import { CognitoEventData } from '../../../../src/domain/value-objects/CognitoEventData';
import { UserRegistrationRules } from '../../../../src/domain/rules/UserRegistrationRules';

jest.mock('../../../../src/domain/rules/UserRegistrationRules');

describe('PostConfirmationOrchestrator', () => {
  let orchestrator: PostConfirmationOrchestrator;
  let userService: jest.Mocked<UserService>;
  let cognitoService: jest.Mocked<CognitoService>;
  let auditService: jest.Mocked<AuditService>;
  let eventPublishingService: jest.Mocked<EventPublishingService>;
  let logger: jest.Mocked<Logger>;
  let config: AuthServiceConfig;

  beforeEach(() => {
    userService = {
      registerOnConfirmation: jest.fn(),
      linkProviderIdentities: jest.fn()
    } as any;

    cognitoService = {
      adminGetUser: jest.fn(),
      parseAdminUser: jest.fn()
    } as any;

    auditService = {
      userRegistered: jest.fn(),
      userUpdated: jest.fn()
    } as any;

    eventPublishingService = {
      publishUserRegistered: jest.fn(),
      publishUserUpdated: jest.fn()
    } as any;

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    } as any;

    config = {
      defaultRole: UserRole.CUSTOMER,
      features: {
        postConfirmationLinkProviders: true
      }
    } as AuthServiceConfig;

    orchestrator = new PostConfirmationOrchestrator(
      userService,
      cognitoService,
      auditService,
      eventPublishingService,
      config,
      logger
    );

    jest.clearAllMocks();
  });

  describe('processPostConfirmation', () => {
    it('should process event successfully', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const cognitoData = {
        mfaEnabled: false,
        identities: []
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const registrationResult = {
        user,
        created: true
      };

      (UserRegistrationRules.determineInitialRole as jest.Mock).mockReturnValue(UserRole.CUSTOMER);
      (UserRegistrationRules.determineInitialStatus as jest.Mock).mockReturnValue('ACTIVE' as any);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.registerOnConfirmation.mockResolvedValue(registrationResult as any);
      auditService.userRegistered.mockResolvedValue(undefined);
      eventPublishingService.publishUserRegistered.mockResolvedValue(undefined);

      const result = await orchestrator.processPostConfirmation(event);

      expect(result).toBe(event);
      expect(userService.registerOnConfirmation).toHaveBeenCalled();
      expect(auditService.userRegistered).toHaveBeenCalled();
    });
  });

  describe('processPostConfirmationWithData', () => {
    it('should register user successfully with intended role', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .withUserAttributes({
          [CognitoAttribute.CUSTOM_ROLE]: UserRole.LAWYER
        })
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const cognitoData = {
        mfaEnabled: false,
        identities: []
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const registrationResult = {
        user,
        created: true
      };

      (UserRegistrationRules.determineInitialRole as jest.Mock).mockReturnValue(UserRole.LAWYER);
      (UserRegistrationRules.determineInitialStatus as jest.Mock).mockReturnValue('ACTIVE' as any);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.registerOnConfirmation.mockResolvedValue(registrationResult as any);
      auditService.userRegistered.mockResolvedValue(undefined);
      eventPublishingService.publishUserRegistered.mockResolvedValue(undefined);

      const result = await orchestrator.processPostConfirmationWithData(event, eventData);

      expect(result).toBe(event);
      expect(userService.registerOnConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          cognitoSub: 'test-cognito-sub',
          email: 'test@example.com'
        })
      );
    });

    it('should link provider identities when enabled and identities exist', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const cognitoData = {
        mfaEnabled: false,
        identities: [
          { provider: OAuthProvider.GOOGLE, providerAccountId: 'google-123' }
        ]
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const registrationResult = {
        user,
        created: true
      };

      (UserRegistrationRules.determineInitialRole as jest.Mock).mockReturnValue(UserRole.CUSTOMER);
      (UserRegistrationRules.determineInitialStatus as jest.Mock).mockReturnValue('ACTIVE' as any);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.registerOnConfirmation.mockResolvedValue(registrationResult as any);
      userService.linkProviderIdentities.mockResolvedValue(undefined);
      auditService.userRegistered.mockResolvedValue(undefined);
      eventPublishingService.publishUserRegistered.mockResolvedValue(undefined);

      await orchestrator.processPostConfirmationWithData(event, eventData);

      expect(userService.linkProviderIdentities).toHaveBeenCalled();
    });

    it('should not link provider identities when disabled in config', async () => {
      config.features.postConfirmationLinkProviders = false;

      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const cognitoData = {
        mfaEnabled: false,
        identities: [
          { provider: OAuthProvider.GOOGLE, providerAccountId: 'google-123' }
        ]
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const registrationResult = {
        user,
        created: true
      };

      (UserRegistrationRules.determineInitialRole as jest.Mock).mockReturnValue(UserRole.CUSTOMER);
      (UserRegistrationRules.determineInitialStatus as jest.Mock).mockReturnValue('ACTIVE' as any);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.registerOnConfirmation.mockResolvedValue(registrationResult as any);
      auditService.userRegistered.mockResolvedValue(undefined);
      eventPublishingService.publishUserRegistered.mockResolvedValue(undefined);

      await orchestrator.processPostConfirmationWithData(event, eventData);

      expect(userService.linkProviderIdentities).not.toHaveBeenCalled();
    });

    it('should handle Cognito data retrieval failure gracefully', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const registrationResult = {
        user,
        created: true
      };

      (UserRegistrationRules.determineInitialRole as jest.Mock).mockReturnValue(UserRole.CUSTOMER);
      (UserRegistrationRules.determineInitialStatus as jest.Mock).mockReturnValue('ACTIVE' as any);
      cognitoService.adminGetUser.mockRejectedValue(new Error('Cognito error'));
      userService.registerOnConfirmation.mockResolvedValue(registrationResult as any);
      auditService.userRegistered.mockResolvedValue(undefined);
      eventPublishingService.publishUserRegistered.mockResolvedValue(undefined);

      const result = await orchestrator.processPostConfirmationWithData(event, eventData);

      expect(result).toBe(event);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to retrieve Cognito data',
        expect.any(Object)
      );
    });

    it('should handle non-critical errors and return event', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const cognitoData = {
        mfaEnabled: false,
        identities: []
      };

      (UserRegistrationRules.determineInitialRole as jest.Mock).mockReturnValue(UserRole.CUSTOMER);
      (UserRegistrationRules.determineInitialStatus as jest.Mock).mockReturnValue('ACTIVE' as any);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.registerOnConfirmation.mockRejectedValue(new Error('Non-critical error'));

      const result = await orchestrator.processPostConfirmationWithData(event, eventData);

      expect(result).toBe(event);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should throw error for critical errors', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const cognitoData = {
        mfaEnabled: false,
        identities: []
      };

      (UserRegistrationRules.determineInitialRole as jest.Mock).mockReturnValue(UserRole.CUSTOMER);
      (UserRegistrationRules.determineInitialStatus as jest.Mock).mockReturnValue('ACTIVE' as any);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.registerOnConfirmation.mockRejectedValue(new Error('duplicate key violation'));

      await expect(
        orchestrator.processPostConfirmationWithData(event, eventData)
      ).rejects.toThrow();
    });

    it('should handle provider linking errors gracefully', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const cognitoData = {
        mfaEnabled: false,
        identities: [
          { provider: OAuthProvider.GOOGLE, providerAccountId: 'google-123' }
        ]
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const registrationResult = {
        user,
        created: true
      };

      (UserRegistrationRules.determineInitialRole as jest.Mock).mockReturnValue(UserRole.CUSTOMER);
      (UserRegistrationRules.determineInitialStatus as jest.Mock).mockReturnValue('ACTIVE' as any);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.registerOnConfirmation.mockResolvedValue(registrationResult as any);
      userService.linkProviderIdentities.mockRejectedValue(new Error('Linking error'));
      auditService.userRegistered.mockResolvedValue(undefined);
      eventPublishingService.publishUserRegistered.mockResolvedValue(undefined);

      const result = await orchestrator.processPostConfirmationWithData(event, eventData);

      expect(result).toBe(event);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to link provider identities',
        expect.any(Object)
      );
    });

    it('should handle audit event creation failures gracefully', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const cognitoData = {
        mfaEnabled: false,
        identities: []
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const registrationResult = {
        user,
        created: true
      };

      (UserRegistrationRules.determineInitialRole as jest.Mock).mockReturnValue(UserRole.CUSTOMER);
      (UserRegistrationRules.determineInitialStatus as jest.Mock).mockReturnValue('ACTIVE' as any);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.registerOnConfirmation.mockResolvedValue(registrationResult as any);
      auditService.userRegistered.mockRejectedValue(new Error('Audit error'));
      eventPublishingService.publishUserRegistered.mockResolvedValue(undefined);

      const result = await orchestrator.processPostConfirmationWithData(event, eventData);

      expect(result).toBe(event);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to create audit events',
        expect.any(Object)
      );
    });

    it('should handle existing user update scenario', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const cognitoData = {
        mfaEnabled: false,
        identities: []
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const registrationResult = {
        user,
        created: false
      };

      (UserRegistrationRules.determineInitialRole as jest.Mock).mockReturnValue(UserRole.CUSTOMER);
      (UserRegistrationRules.determineInitialStatus as jest.Mock).mockReturnValue('ACTIVE' as any);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.registerOnConfirmation.mockResolvedValue(registrationResult as any);
      auditService.userUpdated.mockResolvedValue(undefined);
      eventPublishingService.publishUserUpdated.mockResolvedValue(undefined);

      const result = await orchestrator.processPostConfirmationWithData(event, eventData);

      expect(result).toBe(event);
      expect(auditService.userUpdated).toHaveBeenCalled();
      expect(eventPublishingService.publishUserUpdated).toHaveBeenCalled();
    });

    it('should log registration success with next steps', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const cognitoData = {
        mfaEnabled: false,
        identities: []
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const registrationResult = {
        user,
        created: true
      };

      (UserRegistrationRules.determineInitialRole as jest.Mock).mockReturnValue(UserRole.CUSTOMER);
      (UserRegistrationRules.determineInitialStatus as jest.Mock).mockReturnValue('ACTIVE' as any);
      (UserRegistrationRules.getNextSteps as jest.Mock).mockReturnValue(['Complete profile']);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.registerOnConfirmation.mockResolvedValue(registrationResult as any);
      auditService.userRegistered.mockResolvedValue(undefined);
      eventPublishingService.publishUserRegistered.mockResolvedValue(undefined);

      await orchestrator.processPostConfirmationWithData(event, eventData);

      expect(logger.info).toHaveBeenCalledWith(
        'PostConfirmation successful',
        expect.objectContaining({
          cognitoSub: 'test-cognito-sub',
          created: true
        })
      );
    });
  });
});

