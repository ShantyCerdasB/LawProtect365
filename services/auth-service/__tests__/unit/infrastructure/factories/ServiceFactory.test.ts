/**
 * @fileoverview ServiceFactory Tests - Unit tests for ServiceFactory
 * @summary Tests all service factory methods
 * @description Tests that ServiceFactory correctly creates service instances with proper dependencies.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UserService } from '../../../../src/services/UserService';
import { CognitoService } from '../../../../src/services/CognitoService';
import { AuditService } from '../../../../src/services/AuditService';
import { EventPublishingService } from '../../../../src/services/EventPublishingService';
import { UserRepository } from '../../../../src/repositories/UserRepository';
import { OAuthAccountRepository } from '../../../../src/repositories/OAuthAccountRepository';
import { UserAuditEventRepository } from '../../../../src/repositories/UserAuditEventRepository';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

jest.mock('../../../../src/config/AppConfig', () => ({
  loadConfig: jest.fn(() => ({
    aws: {
      cognito: {
        userPoolId: 'test-pool-id'
      }
    }
  }))
}));

import { ServiceFactory } from '../../../../src/infrastructure/factories/ServiceFactory';

describe('ServiceFactory', () => {
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockOAuthAccountRepository: jest.Mocked<OAuthAccountRepository>;
  let mockUserPersonalInfoRepository: any;
  let mockEventPublishingService: jest.Mocked<EventPublishingService>;
  let mockCognitoClient: CognitoIdentityProviderClient;
  let mockLogger: any;
  let mockOutboxRepository: any;

  beforeEach(() => {
    mockUserRepository = {} as jest.Mocked<UserRepository>;
    mockOAuthAccountRepository = {} as jest.Mocked<OAuthAccountRepository>;
    mockUserPersonalInfoRepository = {};
    mockEventPublishingService = {} as jest.Mocked<EventPublishingService>;
    mockCognitoClient = {} as CognitoIdentityProviderClient;
    mockLogger = {};
    mockOutboxRepository = {};
    jest.clearAllMocks();
  });

  describe('createUserService', () => {
    it('creates UserService instance', () => {
      const service = ServiceFactory.createUserService(
        mockUserRepository,
        mockOAuthAccountRepository,
        mockUserPersonalInfoRepository,
        mockEventPublishingService
      );

      expect(service).toBeInstanceOf(UserService);
    });
  });

  describe('createCognitoService', () => {
    it('creates CognitoService instance', () => {
      const service = ServiceFactory.createCognitoService(mockCognitoClient, mockLogger);

      expect(service).toBeInstanceOf(CognitoService);
    });

  });

  describe('createAuditService', () => {
    it('creates AuditService instance', () => {
      const mockUserAuditEventRepository = {} as jest.Mocked<UserAuditEventRepository>;
      const service = ServiceFactory.createAuditService(mockUserAuditEventRepository);

      expect(service).toBeInstanceOf(AuditService);
    });
  });

  describe('createIntegrationEventPublisher', () => {
    it('creates OutboxEventPublisher instance', () => {
      const publisher = ServiceFactory.createIntegrationEventPublisher(mockOutboxRepository);

      expect(publisher).toBeDefined();
    });
  });

  describe('createEventPublishingService', () => {
    it('creates EventPublishingService instance', () => {
      const mockIntegrationEventPublisher = {} as any;
      const service = ServiceFactory.createEventPublishingService(mockIntegrationEventPublisher);

      expect(service).toBeInstanceOf(EventPublishingService);
    });
  });

  describe('createAll', () => {
    it('creates all services with dependencies', () => {
      const repositories = {
        userRepository: mockUserRepository,
        oauthAccountRepository: mockOAuthAccountRepository,
        userPersonalInfoRepository: mockUserPersonalInfoRepository,
        userAuditEventRepository: {} as jest.Mocked<UserAuditEventRepository>
      };
      const infrastructure = {
        outboxRepository: mockOutboxRepository,
        cognitoClient: mockCognitoClient
      };

      const services = ServiceFactory.createAll(repositories, infrastructure, mockLogger);

      expect(services.userService).toBeInstanceOf(UserService);
      expect(services.cognitoService).toBeInstanceOf(CognitoService);
      expect(services.auditService).toBeInstanceOf(AuditService);
      expect(services.eventPublishingService).toBeInstanceOf(EventPublishingService);
      expect(services.integrationEventPublisher).toBeDefined();
    });
  });
});

