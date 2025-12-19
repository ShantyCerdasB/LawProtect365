/**
 * @fileoverview UnlinkProviderUseCase Tests - Unit tests for UnlinkProviderUseCase
 * @summary Tests for OAuth provider unlinking use case
 * @description Tests all methods in UnlinkProviderUseCase including direct and confirm modes.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UnlinkProviderUseCase } from '../../../../src/application/users/UnlinkProviderUseCase';
import { UserService } from '../../../../src/services/UserService';
import { CognitoService } from '../../../../src/services/CognitoService';
import { OAuthAccountRepository } from '../../../../src/repositories/OAuthAccountRepository';
import { AuditService } from '../../../../src/services/AuditService';
import { EventPublishingService } from '../../../../src/services/EventPublishingService';
import { Logger } from '@lawprotect/shared-ts';
import { UnlinkingMode, OAuthProvider, ProviderUnlinkingStatus } from '../../../../src/domain/enums';
import { AuthServiceConfig } from '../../../../src/config/AppConfig';
import { TestUtils } from '../../../helpers/testUtils';
import { userEntity } from '../../../helpers/builders/user';
import { oauthAccountEntity } from '../../../helpers/builders/oauthAccount';
import { CognitoSub } from '../../../../src/domain/value-objects/CognitoSub';
import { UserId } from '../../../../src/domain/value-objects/UserId';
import { ProviderUnlinkingRules } from '../../../../src/domain/rules/ProviderUnlinkingRules';
import { oauthProviderNotSupported } from '../../../../src/auth-errors/factories';

jest.mock('../../../../src/domain/rules/ProviderUnlinkingRules');

describe('UnlinkProviderUseCase', () => {
  let useCase: UnlinkProviderUseCase;
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
      adminUnlinkProviderForUser: jest.fn()
    } as any;

    oauthAccountRepository = {
      findByProviderAndAccountId: jest.fn(),
      listByUserId: jest.fn(),
      delete: jest.fn()
    } as any;

    auditService = {
      userProviderUnlinked: jest.fn()
    } as any;

    eventPublishingService = {
      publishUserProviderUnlinked: jest.fn()
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
          enabledModes: [UnlinkingMode.DIRECT, UnlinkingMode.CONFIRM],
          stateTtlSeconds: 300,
          enforceEmailMatch: false,
          maxAttemptsPerHour: 5
        }
      }
    } as AuthServiceConfig;

    useCase = new UnlinkProviderUseCase(
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
      const input = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.APPLE,
        providerAccountId: 'test-id',
        cognitoSub: TestUtils.generateCognitoSub()
      };

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {
        throw oauthProviderNotSupported();
      });

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw error when mode is not enabled', async () => {
      const input = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'test-id',
        cognitoSub: TestUtils.generateCognitoSub()
      };

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.ensureModeEnabled as jest.Mock).mockImplementation(() => {
        throw oauthProviderNotSupported();
      });

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should handle direct mode successfully', async () => {
      const input = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        cognitoSub: TestUtils.generateCognitoSub()
      };
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({
        id: userId,
        cognitoSub: CognitoSub.fromString(input.cognitoSub)
      });
      const existingAccount = oauthAccountEntity({ userId, provider: OAuthProvider.GOOGLE });

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.ensureModeEnabled as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderUnlinkingRules.checkForConflicts as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.shouldAllowUnlinking as jest.Mock).mockReturnValue(true);
      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.findByProviderAndAccountId.mockResolvedValue(existingAccount as any);
      oauthAccountRepository.listByUserId.mockResolvedValue([existingAccount as any]);
      cognitoService.adminUnlinkProviderForUser.mockResolvedValue(undefined);
      oauthAccountRepository.delete.mockResolvedValue(undefined);
      auditService.userProviderUnlinked.mockResolvedValue(undefined);
      eventPublishingService.publishUserProviderUnlinked.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.unlinked).toBe(true);
      expect(result.provider).toBe(OAuthProvider.GOOGLE);
      expect(result.status).toBe(ProviderUnlinkingStatus.SUCCESS);
      expect(cognitoService.adminUnlinkProviderForUser).toHaveBeenCalled();
      expect(oauthAccountRepository.delete).toHaveBeenCalled();
    });

    it('should handle confirm mode successfully', async () => {
      const input = {
        mode: UnlinkingMode.CONFIRM,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        confirmationToken: 'valid-token',
        cognitoSub: TestUtils.generateCognitoSub()
      };
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({
        id: userId,
        cognitoSub: CognitoSub.fromString(input.cognitoSub)
      });
      const existingAccount = oauthAccountEntity({ userId, provider: OAuthProvider.GOOGLE });

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.ensureModeEnabled as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderUnlinkingRules.checkForConflicts as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.shouldAllowUnlinking as jest.Mock).mockReturnValue(true);
      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.findByProviderAndAccountId.mockResolvedValue(existingAccount as any);
      oauthAccountRepository.listByUserId.mockResolvedValue([existingAccount as any]);
      cognitoService.adminUnlinkProviderForUser.mockResolvedValue(undefined);
      oauthAccountRepository.delete.mockResolvedValue(undefined);
      auditService.userProviderUnlinked.mockResolvedValue(undefined);
      eventPublishingService.publishUserProviderUnlinked.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.unlinked).toBe(true);
    });

    it('should throw error when confirm mode missing confirmationToken', async () => {
      const input = {
        mode: UnlinkingMode.CONFIRM,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        cognitoSub: TestUtils.generateCognitoSub()
      };

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.ensureModeEnabled as jest.Mock).mockImplementation(() => {});

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw error when provider account ID format is invalid', async () => {
      const input = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'invalid-id',
        cognitoSub: TestUtils.generateCognitoSub()
      };

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.ensureModeEnabled as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(false);

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw error when user not found', async () => {
      const input = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        cognitoSub: TestUtils.generateCognitoSub()
      };

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.ensureModeEnabled as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      userService.findByCognitoSub.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw error when unlinking not allowed', async () => {
      const input = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        cognitoSub: TestUtils.generateCognitoSub()
      };
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({
        id: userId,
        cognitoSub: CognitoSub.fromString(input.cognitoSub)
      });
      const existingAccount = oauthAccountEntity({ userId, provider: OAuthProvider.GOOGLE });

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.ensureModeEnabled as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderUnlinkingRules.checkForConflicts as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.shouldAllowUnlinking as jest.Mock).mockReturnValue(false);
      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.findByProviderAndAccountId.mockResolvedValue(existingAccount as any);
      oauthAccountRepository.listByUserId.mockResolvedValue([existingAccount as any]);

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw error when Cognito unlinking fails', async () => {
      const input = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        cognitoSub: TestUtils.generateCognitoSub()
      };
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({
        id: userId,
        cognitoSub: CognitoSub.fromString(input.cognitoSub)
      });
      const existingAccount = oauthAccountEntity({ userId, provider: OAuthProvider.GOOGLE });

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.ensureModeEnabled as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderUnlinkingRules.checkForConflicts as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.shouldAllowUnlinking as jest.Mock).mockReturnValue(true);
      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.findByProviderAndAccountId.mockResolvedValue(existingAccount as any);
      oauthAccountRepository.listByUserId.mockResolvedValue([existingAccount as any]);
      cognitoService.adminUnlinkProviderForUser.mockRejectedValue(new Error('Cognito error'));

      await expect(useCase.execute(input)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to unlink provider in Cognito',
        expect.any(Object)
      );
    });

    it('should throw error when database deletion fails', async () => {
      const input = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        cognitoSub: TestUtils.generateCognitoSub()
      };
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({
        id: userId,
        cognitoSub: CognitoSub.fromString(input.cognitoSub)
      });
      const existingAccount = oauthAccountEntity({ userId, provider: OAuthProvider.GOOGLE });

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.ensureModeEnabled as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderUnlinkingRules.checkForConflicts as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.shouldAllowUnlinking as jest.Mock).mockReturnValue(true);
      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.findByProviderAndAccountId.mockResolvedValue(existingAccount as any);
      oauthAccountRepository.listByUserId.mockResolvedValue([existingAccount as any]);
      cognitoService.adminUnlinkProviderForUser.mockResolvedValue(undefined);
      oauthAccountRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(input)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to remove provider link',
        expect.any(Object)
      );
    });

    it('should continue if audit event creation fails', async () => {
      const input = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        cognitoSub: TestUtils.generateCognitoSub()
      };
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({
        id: userId,
        cognitoSub: CognitoSub.fromString(input.cognitoSub)
      });
      const existingAccount = oauthAccountEntity({ userId, provider: OAuthProvider.GOOGLE });

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.ensureModeEnabled as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderUnlinkingRules.checkForConflicts as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.shouldAllowUnlinking as jest.Mock).mockReturnValue(true);
      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.findByProviderAndAccountId.mockResolvedValue(existingAccount as any);
      oauthAccountRepository.listByUserId.mockResolvedValue([existingAccount as any]);
      cognitoService.adminUnlinkProviderForUser.mockResolvedValue(undefined);
      oauthAccountRepository.delete.mockResolvedValue(undefined);
      auditService.userProviderUnlinked.mockRejectedValue(new Error('Audit error'));
      eventPublishingService.publishUserProviderUnlinked.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.unlinked).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to create audit event for provider unlinking',
        expect.any(Object)
      );
    });

    it('should continue if event publishing fails', async () => {
      const input = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        cognitoSub: TestUtils.generateCognitoSub()
      };
      const userId = UserId.fromString(TestUtils.generateUuid());
      const user = userEntity({
        id: userId,
        cognitoSub: CognitoSub.fromString(input.cognitoSub)
      });
      const existingAccount = oauthAccountEntity({ userId, provider: OAuthProvider.GOOGLE });

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.ensureModeEnabled as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.validateProviderAccountId as jest.Mock).mockReturnValue(true);
      (ProviderUnlinkingRules.checkForConflicts as jest.Mock).mockImplementation(() => {});
      (ProviderUnlinkingRules.shouldAllowUnlinking as jest.Mock).mockReturnValue(true);
      userService.findByCognitoSub.mockResolvedValue(user);
      oauthAccountRepository.findByProviderAndAccountId.mockResolvedValue(existingAccount as any);
      oauthAccountRepository.listByUserId.mockResolvedValue([existingAccount as any]);
      cognitoService.adminUnlinkProviderForUser.mockResolvedValue(undefined);
      oauthAccountRepository.delete.mockResolvedValue(undefined);
      auditService.userProviderUnlinked.mockResolvedValue(undefined);
      eventPublishingService.publishUserProviderUnlinked.mockRejectedValue(new Error('Publish error'));

      const result = await useCase.execute(input);

      expect(result.unlinked).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to publish integration event for provider unlinking',
        expect.any(Object)
      );
    });

    it('should log error when execution fails', async () => {
      const input = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: '123456789',
        cognitoSub: TestUtils.generateCognitoSub()
      };

      (ProviderUnlinkingRules.ensureProviderAllowed as jest.Mock).mockImplementation(() => {
        throw new Error('Provider not allowed');
      });

      await expect(useCase.execute(input)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Error in provider unlinking use case',
        expect.objectContaining({
          mode: UnlinkingMode.DIRECT,
          provider: OAuthProvider.GOOGLE
        })
      );
    });
  });
});

