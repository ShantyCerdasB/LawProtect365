/**
 * @fileoverview PostAuthenticationOrchestrator Tests - Unit tests for PostAuthenticationOrchestrator
 * @summary Tests for PostAuthentication orchestrator
 * @description Tests all methods in PostAuthenticationOrchestrator including event processing, user upsert, and audit events.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { PostAuthenticationOrchestrator } from '../../../../src/application/triggers/PostAuthenticationOrchestrator';
import { UserService } from '../../../../src/services/UserService';
import { CognitoService } from '../../../../src/services/CognitoService';
import { AuditService } from '../../../../src/services/AuditService';
import { EventPublishingService } from '../../../../src/services/EventPublishingService';
import { PostAuthEventBuilder } from '../../../helpers/builders';
import { userEntity } from '../../../helpers/builders/user';
import { CognitoSub } from '../../../../src/domain/value-objects/CognitoSub';
import { CognitoEventData } from '../../../../src/domain/value-objects/CognitoEventData';
import { OAuthProvider } from '../../../../src/domain/enums';

describe('PostAuthenticationOrchestrator', () => {
  let orchestrator: PostAuthenticationOrchestrator;
  let userService: jest.Mocked<UserService>;
  let cognitoService: jest.Mocked<CognitoService>;
  let auditService: jest.Mocked<AuditService>;
  let eventPublishingService: jest.Mocked<EventPublishingService>;

  beforeEach(() => {
    userService = {
      upsertOnPostAuth: jest.fn(),
      linkProviderIdentities: jest.fn()
    } as any;

    cognitoService = {
      adminGetUser: jest.fn(),
      parseAdminUser: jest.fn()
    } as any;

    auditService = {
      userRegistered: jest.fn(),
      userUpdated: jest.fn(),
      mfaEnabled: jest.fn(),
      mfaDisabled: jest.fn()
    } as any;

    eventPublishingService = {
      publishUserRegistered: jest.fn(),
      publishUserUpdated: jest.fn()
    } as any;

    orchestrator = new PostAuthenticationOrchestrator(
      userService,
      cognitoService,
      auditService,
      eventPublishingService
    );

    jest.clearAllMocks();
  });

  describe('processPostAuthentication', () => {
    it('should process event successfully', async () => {
      const event = new PostAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const cognitoData = {
        mfaEnabled: false,
        identities: []
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const userResult = {
        user,
        created: false,
        mfaChanged: false
      };

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.upsertOnPostAuth.mockResolvedValue(userResult);
      auditService.userUpdated.mockResolvedValue(undefined);
      eventPublishingService.publishUserUpdated.mockResolvedValue(undefined);

      const result = await orchestrator.processPostAuthentication(event);

      expect(result).toBe(event);
      expect(cognitoService.adminGetUser).toHaveBeenCalledWith('test-cognito-sub');
      expect(userService.upsertOnPostAuth).toHaveBeenCalled();
    });
  });

  describe('processPostAuthenticationWithData', () => {
    it('should process event with extracted data for new user', async () => {
      const event = new PostAuthEventBuilder()
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
      const userResult = {
        user,
        created: true,
        mfaChanged: false
      };

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.upsertOnPostAuth.mockResolvedValue(userResult);
      auditService.userRegistered.mockResolvedValue(undefined);
      eventPublishingService.publishUserRegistered.mockResolvedValue(undefined);

      const result = await orchestrator.processPostAuthenticationWithData(event, eventData);

      expect(result).toBe(event);
      expect(auditService.userRegistered).toHaveBeenCalled();
      expect(eventPublishingService.publishUserRegistered).toHaveBeenCalled();
    });

    it('should process event for existing user with MFA change', async () => {
      const event = new PostAuthEventBuilder()
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
        mfaEnabled: true,
        identities: []
      };
      const user = userEntity({
        cognitoSub: CognitoSub.fromString('test-cognito-sub'),
        mfaEnabled: true
      });
      const userResult = {
        user,
        created: false,
        mfaChanged: true
      };

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.upsertOnPostAuth.mockResolvedValue(userResult);
      auditService.mfaEnabled.mockResolvedValue(undefined);
      auditService.userUpdated.mockResolvedValue(undefined);
      eventPublishingService.publishUserUpdated.mockResolvedValue(undefined);

      await orchestrator.processPostAuthenticationWithData(event, eventData);

      expect(auditService.mfaEnabled).toHaveBeenCalled();
      expect(auditService.userUpdated).toHaveBeenCalled();
    });

    it('should link OAuth accounts when identities exist', async () => {
      const event = new PostAuthEventBuilder()
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
        identities: [{ provider: OAuthProvider.GOOGLE, providerAccountId: 'google-id' }]
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const userResult = {
        user,
        created: false,
        mfaChanged: false
      };

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.upsertOnPostAuth.mockResolvedValue(userResult);
      userService.linkProviderIdentities.mockResolvedValue(undefined);
      auditService.userUpdated.mockResolvedValue(undefined);
      eventPublishingService.publishUserUpdated.mockResolvedValue(undefined);

      await orchestrator.processPostAuthenticationWithData(event, eventData);

      expect(userService.linkProviderIdentities).toHaveBeenCalledWith(
        user.getId().toString(),
        cognitoData.identities
      );
    });

    it('should not link OAuth accounts when no identities', async () => {
      const event = new PostAuthEventBuilder()
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
      const userResult = {
        user,
        created: false,
        mfaChanged: false
      };

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.upsertOnPostAuth.mockResolvedValue(userResult);
      auditService.userUpdated.mockResolvedValue(undefined);
      eventPublishingService.publishUserUpdated.mockResolvedValue(undefined);

      await orchestrator.processPostAuthenticationWithData(event, eventData);

      expect(userService.linkProviderIdentities).not.toHaveBeenCalled();
    });

    it('should handle OAuth linking errors gracefully', async () => {
      const event = new PostAuthEventBuilder()
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
        identities: [{ provider: OAuthProvider.GOOGLE, providerAccountId: 'google-id' }]
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const userResult = {
        user,
        created: false,
        mfaChanged: false
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.upsertOnPostAuth.mockResolvedValue(userResult);
      userService.linkProviderIdentities.mockRejectedValue(new Error('Linking failed'));
      auditService.userUpdated.mockResolvedValue(undefined);
      eventPublishingService.publishUserUpdated.mockResolvedValue(undefined);

      await orchestrator.processPostAuthenticationWithData(event, eventData);

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should throw error when Cognito data retrieval fails', async () => {
      const event = new PostAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      cognitoService.adminGetUser.mockRejectedValue(new Error('Cognito error'));

      await expect(
        orchestrator.processPostAuthenticationWithData(event, eventData)
      ).rejects.toThrow();
    });

    it('should throw error when user upsert fails', async () => {
      const event = new PostAuthEventBuilder()
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

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.upsertOnPostAuth.mockRejectedValue(new Error('Upsert error'));

      await expect(
        orchestrator.processPostAuthenticationWithData(event, eventData)
      ).rejects.toThrow();
    });

    it('should handle MFA disabled audit event', async () => {
      const event = new PostAuthEventBuilder()
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
      const user = userEntity({
        cognitoSub: CognitoSub.fromString('test-cognito-sub'),
        mfaEnabled: false
      });
      const userResult = {
        user,
        created: false,
        mfaChanged: true
      };

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseAdminUser.mockReturnValue(cognitoData);
      userService.upsertOnPostAuth.mockResolvedValue(userResult);
      auditService.mfaDisabled.mockResolvedValue(undefined);
      auditService.userUpdated.mockResolvedValue(undefined);
      eventPublishingService.publishUserUpdated.mockResolvedValue(undefined);

      await orchestrator.processPostAuthenticationWithData(event, eventData);

      expect(auditService.mfaDisabled).toHaveBeenCalled();
    });
  });
});

