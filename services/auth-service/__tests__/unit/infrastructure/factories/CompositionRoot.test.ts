/**
 * @fileoverview CompositionRoot Tests - Unit tests for CompositionRoot
 * @summary Tests all composition root factory methods
 * @description Tests that CompositionRoot correctly creates all use cases and services with proper dependencies.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CompositionRoot } from '../../../../src/infrastructure/factories/CompositionRoot';
import { RepositoryFactory } from '../../../../src/infrastructure/factories/RepositoryFactory';
import { ServiceFactory } from '../../../../src/infrastructure/factories/ServiceFactory';
import { AwsClientFactory } from '../../../../src/infrastructure/factories/AwsClientFactory';
import { GetMeUseCase } from '../../../../src/application/users/GetMeUseCase';
import { LinkProviderUseCase } from '../../../../src/application/users/LinkProviderUseCase';
import { UnlinkProviderUseCase } from '../../../../src/application/users/UnlinkProviderUseCase';
import { GetUsersAdminUseCase } from '../../../../src/application/admin/GetUsersAdminUseCase';
import { GetUserByIdAdminUseCase } from '../../../../src/application/admin/GetUserByIdAdminUseCase';
import { SetUserStatusAdminUseCase } from '../../../../src/application/admin/SetUserStatusAdminUseCase';
import { SetUserRoleAdminUseCase } from '../../../../src/application/admin/SetUserRoleAdminUseCase';
import { PatchMeUseCase } from '../../../../src/application/users/PatchMeUseCase';
import * as loggerModule from '../../../../src/utils/logger';
import * as AppConfig from '../../../../src/config/AppConfig';

jest.mock('../../../../src/infrastructure/factories/RepositoryFactory');
jest.mock('../../../../src/infrastructure/factories/ServiceFactory');
jest.mock('../../../../src/infrastructure/factories/AwsClientFactory');
jest.mock('../../../../src/config/AppConfig');
jest.mock('../../../../src/utils/logger');

describe('CompositionRoot', () => {
  const mockLogger = {};
  const mockConfig = {};
  const mockRepositories = {
    userRepository: {},
    oauthAccountRepository: {},
    userAuditEventRepository: {},
    userPersonalInfoRepository: {}
  };
  const mockInfrastructure = {
    cognitoClient: {},
    eventBridgeClient: {},
    dynamoDBClient: {},
    outboxRepository: {},
    eventBridgeAdapter: {},
    logger: mockLogger
  };
  const mockServices = {
    userService: {},
    cognitoService: {},
    auditService: {},
    eventPublishingService: {},
    integrationEventPublisher: {}
  };

  beforeEach(() => {
    jest.spyOn(loggerModule, 'createServiceLogger').mockReturnValue(mockLogger as any);
    jest.spyOn(AppConfig, 'loadConfig').mockReturnValue(mockConfig as any);
    jest.spyOn(RepositoryFactory, 'createAll').mockReturnValue(mockRepositories as any);
    jest.spyOn(AwsClientFactory, 'createAll').mockReturnValue(mockInfrastructure as any);
    jest.spyOn(ServiceFactory, 'createAll').mockReturnValue(mockServices as any);
    jest.clearAllMocks();
  });

  describe('build', () => {
    it('creates CompositionRoot with all dependencies', async () => {
      const root = await CompositionRoot.build();

      expect(root.logger).toBe(mockLogger);
      expect(root.config).toBe(mockConfig);
      expect(root.userService).toBe(mockServices.userService);
      expect(root.cognitoService).toBe(mockServices.cognitoService);
      expect(root.auditService).toBe(mockServices.auditService);
      expect(root.userRepository).toBe(mockRepositories.userRepository);
      expect(root.oauthAccountRepository).toBe(mockRepositories.oauthAccountRepository);
    });

    it('creates GetMeUseCase', async () => {
      const root = await CompositionRoot.build();

      expect(root.getMeUseCase).toBeInstanceOf(GetMeUseCase);
    });

    it('creates LinkProviderUseCase', async () => {
      const root = await CompositionRoot.build();

      expect(root.linkProviderUseCase).toBeInstanceOf(LinkProviderUseCase);
    });

    it('creates UnlinkProviderUseCase', async () => {
      const root = await CompositionRoot.build();

      expect(root.unlinkProviderUseCase).toBeInstanceOf(UnlinkProviderUseCase);
    });
  });

  describe('createGetMeUseCase', () => {
    it('creates GetMeUseCase instance', () => {
      const useCase = CompositionRoot.createGetMeUseCase();

      expect(useCase).toBeInstanceOf(GetMeUseCase);
      expect(RepositoryFactory.createAll).toHaveBeenCalled();
      expect(AwsClientFactory.createAll).toHaveBeenCalled();
      expect(ServiceFactory.createAll).toHaveBeenCalled();
    });
  });

  describe('createLinkProviderUseCase', () => {
    it('creates LinkProviderUseCase instance', () => {
      const useCase = CompositionRoot.createLinkProviderUseCase();

      expect(useCase).toBeInstanceOf(LinkProviderUseCase);
      expect(AppConfig.loadConfig).toHaveBeenCalled();
      expect(RepositoryFactory.createAll).toHaveBeenCalled();
      expect(AwsClientFactory.createAll).toHaveBeenCalled();
      expect(ServiceFactory.createAll).toHaveBeenCalled();
    });
  });

  describe('createUnlinkProviderUseCase', () => {
    it('creates UnlinkProviderUseCase instance', () => {
      const useCase = CompositionRoot.createUnlinkProviderUseCase();

      expect(useCase).toBeInstanceOf(UnlinkProviderUseCase);
      expect(AppConfig.loadConfig).toHaveBeenCalled();
      expect(RepositoryFactory.createAll).toHaveBeenCalled();
      expect(AwsClientFactory.createAll).toHaveBeenCalled();
      expect(ServiceFactory.createAll).toHaveBeenCalled();
    });
  });

  describe('createGetUsersAdminUseCase', () => {
    it('creates GetUsersAdminUseCase instance', () => {
      const useCase = CompositionRoot.createGetUsersAdminUseCase();

      expect(useCase).toBeInstanceOf(GetUsersAdminUseCase);
      expect(RepositoryFactory.createAll).toHaveBeenCalled();
      expect(AwsClientFactory.createAll).not.toHaveBeenCalled();
    });
  });

  describe('createSetUserStatusAdminUseCase', () => {
    it('creates SetUserStatusAdminUseCase instance', () => {
      const useCase = CompositionRoot.createSetUserStatusAdminUseCase();

      expect(useCase).toBeInstanceOf(SetUserStatusAdminUseCase);
      expect(RepositoryFactory.createAll).toHaveBeenCalled();
      expect(AwsClientFactory.createAll).toHaveBeenCalled();
      expect(ServiceFactory.createAll).toHaveBeenCalled();
    });
  });

  describe('createSetUserRoleAdminUseCase', () => {
    it('creates SetUserRoleAdminUseCase instance', () => {
      const useCase = CompositionRoot.createSetUserRoleAdminUseCase();

      expect(useCase).toBeInstanceOf(SetUserRoleAdminUseCase);
      expect(RepositoryFactory.createAll).toHaveBeenCalled();
      expect(AwsClientFactory.createAll).toHaveBeenCalled();
      expect(ServiceFactory.createAll).toHaveBeenCalled();
    });
  });

  describe('createGetUserByIdAdminUseCase', () => {
    it('creates GetUserByIdAdminUseCase instance', () => {
      const useCase = CompositionRoot.createGetUserByIdAdminUseCase();

      expect(useCase).toBeInstanceOf(GetUserByIdAdminUseCase);
      expect(RepositoryFactory.createAll).toHaveBeenCalled();
      expect(AwsClientFactory.createAll).not.toHaveBeenCalled();
    });
  });

  describe('createPatchMeUseCase', () => {
    it('creates PatchMeUseCase instance', () => {
      const useCase = CompositionRoot.createPatchMeUseCase();

      expect(useCase).toBeInstanceOf(PatchMeUseCase);
      expect(RepositoryFactory.createAll).toHaveBeenCalled();
      expect(AwsClientFactory.createAll).toHaveBeenCalled();
      expect(ServiceFactory.createAll).toHaveBeenCalled();
    });
  });
});

