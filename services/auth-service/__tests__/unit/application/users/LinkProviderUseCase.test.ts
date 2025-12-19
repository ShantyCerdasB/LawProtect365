/**
 * @fileoverview LinkProviderUseCase Tests - Unit tests for LinkProviderUseCase
 * @summary Tests for OAuth provider linking use case
 * @description Tests all methods in LinkProviderUseCase including redirect, direct, and finalize modes.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { LinkProviderUseCase } from '../../../../src/application/users/LinkProviderUseCase';
import { UserService } from '../../../../src/services/UserService';
import { CognitoService } from '../../../../src/services/CognitoService';
import { OAuthAccountRepository } from '../../../../src/repositories/OAuthAccountRepository';
import { AuditService } from '../../../../src/services/AuditService';
import { EventPublishingService } from '../../../../src/services/EventPublishingService';
import { Logger } from '@lawprotect/shared-ts';
import { LinkingMode, OAuthProvider } from '../../../../src/domain/enums';
import { AuthServiceConfig } from '../../../../src/config/AppConfig';
import { TestUtils } from '../../../helpers/testUtils';
import { userEntity } from '../../../helpers/builders/user';
import { oauthAccountEntity } from '../../../helpers/builders/oauthAccount';
import { CognitoSub } from '../../../../src/domain/value-objects/CognitoSub';
import { UserId } from '../../../../src/domain/value-objects/UserId';
import { ProviderLinkingRules } from '../../../../src/domain/rules/ProviderLinkingRules';
import { oauthProviderNotSupported } from '../../../../src/auth-errors/factories';

jest.mock('../../../../src/domain/rules/ProviderLinkingRules');

describe('LinkProviderUseCase', () => {
  let useCase: LinkProviderUseCase;
  let userService: jest.Mocked<UserService>;
  let cognitoService: jest.Mocked<CognitoService>;
  let oauthAccountRepository: jest.Mocked<OAuthAccountRepository>;
  let auditService: jest.Mocked<AuditService>;
  let eventPublishingService: jest.Mocked<EventPublishingService>;
  let logger: jest.Mocked<Logger>;
  let config: AuthServiceConfig;

  beforeEach(() => {
    userService = {
      findByCognitoSub: jest.fn()
    } as any;

    cognitoService = {
      generateHostedUiUrl: jest.fn(),
      validateIdToken: jest.fn(),
      exchangeCodeForToken: jest.fn(),
      adminLinkProviderForUser: jest.fn()
    } as any;

    oauthAccountRepository = {
      findByProviderAndAccountId: jest.fn(),
      upsert: jest.fn()
    } as any;

    auditService = {
      userProviderLinked: jest.fn()
    } as any;

    eventPublishingService = {
      publishUserProviderLinked: jest.fn()
    } as any;

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    } as any;

    config = {
      features: {
        providerLinking: {
          allowedProviders: [OAuthProvider.GOOGLE, OAuthProvider.MICROSOFT_365],
          enabledModes: [LinkingMode.DIRECT, LinkingMode.REDIRECT, LinkingMode.FINALIZE],
          stateTtlSeconds: 300,
          enforceEmailMatch: false,
          maxAttemptsPerHour: 5
        }
      }
    } as AuthServiceConfig;

    useCase = new LinkProviderUseCase(
      userService,
      cognitoService,
      oauthAccountRepository,
      auditService,
      eventPublishingService,
      config,
      logger
    );

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw error when provider is not allowed', async () => {
      const input = { mode: LinkingMode.DIRECT, provider: OAuthProvider.APPLE };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {
        throw oauthProviderNotSupported();
      });

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw error when mode is not supported', async () => {
      const input = { mode: LinkingMode.DIRECT, provider: OAuthProvider.GOOGLE };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(false);

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should handle redirect mode successfully', async () => {
      const input = {
        mode: LinkingMode.REDIRECT,
        provider: OAuthProvider.GOOGLE,
        successUrl: 'https://example.com/success',
        failureUrl: 'https://example.com/failure'
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.generateState as jest.Mock).mockReturnValue('test-state');
      cognitoService.generateHostedUiUrl.mockResolvedValue('https://cognito-url.com');

      const result = await useCase.execute(input);

      expect(result.linkUrl).toBe('https://cognito-url.com');
      expect(cognitoService.generateHostedUiUrl).toHaveBeenCalledWith(
        OAuthProvider.GOOGLE,
        'test-state',
        input.successUrl,
        input.failureUrl
      );
    });

    it('should throw error when redirect mode missing URLs', async () => {
      const input = {
        mode: LinkingMode.REDIRECT,
        provider: OAuthProvider.GOOGLE
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should handle direct mode with idToken successfully', async () => {
      const input = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        idToken: 'test-id-token'
      };
      const cognitoSub = TestUtils.generateCognitoSub();
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, cognitoSub: CognitoSub.fromString(cognitoSub) });
      const identity = {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        email: 'test@example.com'
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.shouldAllowLinking as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.checkForConflicts as jest.Mock).mockImplementation(() => {});
      cognitoService.validateIdToken.mockResolvedValue(identity as any);
      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.findByProviderAndAccountId.mockResolvedValue(null);
      cognitoService.adminLinkProviderForUser.mockResolvedValue(undefined);
      oauthAccountRepository.upsert.mockResolvedValue(oauthAccountEntity({ userId }) as any);
      auditService.userProviderLinked.mockResolvedValue(undefined);
      eventPublishingService.publishUserProviderLinked.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.linked).toBe(true);
      expect(result.provider).toBe(OAuthProvider.GOOGLE);
      expect(cognitoService.validateIdToken).toHaveBeenCalledWith(OAuthProvider.GOOGLE, 'test-id-token');
    });

    it('should handle direct mode with authorizationCode successfully', async () => {
      const input = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: 'test-auth-code'
      };
      const cognitoSub = TestUtils.generateCognitoSub();
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, cognitoSub: CognitoSub.fromString(cognitoSub) });
      const identity = {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        email: 'test@example.com'
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.shouldAllowLinking as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.checkForConflicts as jest.Mock).mockImplementation(() => {});
      cognitoService.exchangeCodeForToken.mockResolvedValue(identity as any);
      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.findByProviderAndAccountId.mockResolvedValue(null);
      cognitoService.adminLinkProviderForUser.mockResolvedValue(undefined);
      oauthAccountRepository.upsert.mockResolvedValue(oauthAccountEntity({ userId }) as any);
      auditService.userProviderLinked.mockResolvedValue(undefined);
      eventPublishingService.publishUserProviderLinked.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.linked).toBe(true);
      expect(cognitoService.exchangeCodeForToken).toHaveBeenCalledWith(OAuthProvider.GOOGLE, 'test-auth-code');
    });

    it('should throw error when direct mode missing both idToken and authorizationCode', async () => {
      const input = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should handle finalize mode successfully', async () => {
      const validState = Buffer.from(JSON.stringify({
        userId: TestUtils.generateUuid(),
        timestamp: Date.now(),
        nonce: 'test-nonce'
      })).toString('base64');
      const input = {
        mode: LinkingMode.FINALIZE,
        provider: OAuthProvider.GOOGLE,
        code: 'test-code',
        state: validState,
        authorizationCode: 'test-auth-code'
      };
      const cognitoSub = TestUtils.generateCognitoSub();
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, cognitoSub: CognitoSub.fromString(cognitoSub) });
      const identity = {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        email: 'test@example.com'
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.validateState as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.shouldAllowLinking as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.checkForConflicts as jest.Mock).mockImplementation(() => {});
      cognitoService.exchangeCodeForToken.mockResolvedValue(identity as any);
      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.findByProviderAndAccountId.mockResolvedValue(null);
      cognitoService.adminLinkProviderForUser.mockResolvedValue(undefined);
      oauthAccountRepository.upsert.mockResolvedValue(oauthAccountEntity({ userId }) as any);
      auditService.userProviderLinked.mockResolvedValue(undefined);
      eventPublishingService.publishUserProviderLinked.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.linked).toBe(true);
      expect(ProviderLinkingRules.validateState).toHaveBeenCalledWith(expect.any(String), config);
    });

    it('should throw error when finalize mode missing state', async () => {
      const input = {
        mode: LinkingMode.FINALIZE,
        provider: OAuthProvider.GOOGLE,
        code: 'test-code'
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw error when finalize mode has invalid state', async () => {
      const input = {
        mode: LinkingMode.FINALIZE,
        provider: OAuthProvider.GOOGLE,
        code: 'test-code',
        state: 'invalid-state'
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.validateState as jest.Mock).mockReturnValue(false);

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should return idempotent response when provider already linked', async () => {
      const input = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        idToken: 'test-id-token'
      };
      const cognitoSub = TestUtils.generateCognitoSub();
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, cognitoSub: CognitoSub.fromString(cognitoSub) });
      const identity = {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        email: 'test@example.com'
      };
      const existingAccount = oauthAccountEntity({ userId });

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.shouldAllowLinking as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.checkForConflicts as jest.Mock).mockImplementation(() => {});
      cognitoService.validateIdToken.mockResolvedValue(identity as any);
      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.findByProviderAndAccountId.mockResolvedValue(existingAccount as any);

      const result = await useCase.execute(input);

      expect(result.linked).toBe(true);
      expect(cognitoService.adminLinkProviderForUser).not.toHaveBeenCalled();
      expect(oauthAccountRepository.upsert).not.toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      const input = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        idToken: 'test-id-token'
      };
      const identity = {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789'
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      cognitoService.validateIdToken.mockResolvedValue(identity as any);
      userService.findByCognitoSub.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw error when linking not allowed for user', async () => {
      const input = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        idToken: 'test-id-token'
      };
      const cognitoSub = TestUtils.generateCognitoSub();
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, cognitoSub: CognitoSub.fromString(cognitoSub) });
      const identity = {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789'
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.shouldAllowLinking as jest.Mock).mockReturnValue(false);
      cognitoService.validateIdToken.mockResolvedValue(identity as any);
      userService.findByCognitoSub.mockResolvedValue(user);

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw error when provider account ID format is invalid', async () => {
      const input = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        idToken: 'test-id-token'
      };
      const cognitoSub = TestUtils.generateCognitoSub();
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({ id: userId, cognitoSub: CognitoSub.fromString(cognitoSub) });
      const identity = {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'invalid-id'
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderLinkingRules.isModeSupported as jest.Mock).mockReturnValue(true);
      (ProviderLinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(false);
      cognitoService.validateIdToken.mockResolvedValue(identity as any);
      userService.findByCognitoSub.mockResolvedValue(user);

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should log error when execution fails', async () => {
      const input = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        idToken: 'test-id-token'
      };

      (ProviderLinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {
        throw new Error('Provider not allowed');
      });

      await expect(useCase.execute(input)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Error in provider linking use case',
        expect.objectContaining({
          mode: LinkingMode.DIRECT,
          provider: OAuthProvider.GOOGLE
        })
      );
    });
  });
});

