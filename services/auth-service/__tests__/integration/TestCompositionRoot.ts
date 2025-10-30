/**
 * @fileoverview TestCompositionRoot - Composition root for integration tests
 * @summary Dependency injection container for integration tests
 * @description Provides a composition root that wires up all dependencies
 * for integration tests using real repositories and mocked services.
 */

import { PrismaClient } from '@prisma/client';
import { InMemoryOutboxRepository } from './fakes/InMemoryOutboxRepository';
import { FakeLogger } from './fakes/FakeLogger';
import { FakeCognitoService } from './fakes/FakeCognitoService';
import { loadTestConfig } from './setup/testEnv';
import { IntegrationEventPublisher } from '@lawprotect/shared-ts';

// Import repositories
import { UserRepository } from '../../src/repositories/UserRepository';
import { OAuthAccountRepository } from '../../src/repositories/OAuthAccountRepository';
import { UserPersonalInfoRepository } from '../../src/repositories/UserPersonalInfoRepository';
import { UserAuditEventRepository } from '../../src/repositories/UserAuditEventRepository';

// Import services
import { UserService } from '../../src/services/UserService';
import { AuditService } from '../../src/services/AuditService';
import { EventPublishingService } from '../../src/services/EventPublishingService';

// Import use cases
import { PatchMeUseCase } from '../../src/application/users/PatchMeUseCase';
import { TestLinkProviderUseCase } from './helpers/TestLinkProviderUseCase';
import { TestGetMeUseCase } from './helpers/TestGetMeUseCase';
import { TestUnlinkProviderUseCase } from './helpers/TestUnlinkProviderUseCase';
import { TestGetUserByIdAdminUseCase } from './helpers/TestGetUserByIdAdminUseCase';
import { TestSetUserRoleAdminUseCase } from './helpers/TestSetUserRoleAdminUseCase';
import { TestSetUserStatusAdminUseCase } from './helpers/TestSetUserStatusAdminUseCase';
import { TestGetUsersAdminUseCase } from './helpers/TestGetUsersAdminUseCase';

// Import handlers
import { testPatchMeHandler } from './TestPatchMeHandler';
import { testLinkProviderHandler } from './helpers/TestLinkProviderHandler';
import { testGetMeHandler } from './helpers/TestGetMeHandler';
import { testUnlinkProviderHandler } from './helpers/TestUnlinkProviderHandler';
import { testGetUserByIdAdminHandler } from './helpers/TestGetUserByIdAdminHandler';
import { testSetUserRoleAdminHandler } from './helpers/TestSetUserRoleAdminHandler';
import { testSetUserStatusAdminHandler } from './helpers/TestSetUserStatusAdminHandler';
import { testGetUsersAdminHandler } from './helpers/TestGetUsersAdminHandler';

/**
 * Test composition root for integration tests
 * 
 * Provides dependency injection for integration tests using:
 * - Real repositories with Prisma → PostgreSQL
 * - Mocked services (OutboxRepository, Logger, CognitoService)
 * - Real business logic and use cases
 */
export class TestCompositionRoot {
  private static instance: TestCompositionRoot;
  private prisma: PrismaClient;
  private outboxRepository: InMemoryOutboxRepository;
  private eventPublisher: any;
  private logger: FakeLogger;
  private cognitoService: FakeCognitoService;

  private constructor() {
    const config = loadTestConfig();
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.databaseUrl
        }
      },
      log: config.logLevel === 'debug' ? ['query', 'info', 'warn', 'error'] : ['error']
    });
    
    this.outboxRepository = new InMemoryOutboxRepository();
    this.eventPublisher = this.outboxRepository as any as IntegrationEventPublisher;
    this.logger = new FakeLogger();
    this.cognitoService = new FakeCognitoService();
  }

  /**
   * Gets the singleton instance of TestCompositionRoot
   * @returns TestCompositionRoot instance
   */
  static getInstance(): TestCompositionRoot {
    if (!TestCompositionRoot.instance) {
      TestCompositionRoot.instance = new TestCompositionRoot();
    }
    return TestCompositionRoot.instance;
  }

  /**
   * Creates repositories with real Prisma client
   * @returns Object containing all repositories
   */
  createRepositories() {
    return {
      userRepository: new UserRepository(this.prisma),
      oauthAccountRepository: new OAuthAccountRepository(this.prisma),
      userPersonalInfoRepository: new UserPersonalInfoRepository(this.prisma),
      userAuditEventRepository: new UserAuditEventRepository(this.prisma)
    };
  }

  /**
   * Creates services with mocked dependencies
   * @returns Object containing all services
   */
  createServices() {
    const repositories = this.createRepositories();
    
    return {
      userService: new UserService(
        repositories.userRepository,
        repositories.oauthAccountRepository,
        repositories.userPersonalInfoRepository,
        new EventPublishingService(this.eventPublisher)
      ),
      auditService: new AuditService(repositories.userAuditEventRepository),
      eventPublishingService: new EventPublishingService(this.eventPublisher)
    };
  }

  /**
   * Creates use cases with all dependencies
   * @returns Object containing all use cases
   */
  createUseCases() {
    const services = this.createServices();
    
    return {
      patchMeUseCase: new PatchMeUseCase(
        services.userService,
        services.auditService,
        this.logger as any
      ),
      linkProviderUseCase: new TestLinkProviderUseCase(this.prisma),
      getMeUseCase: new TestGetMeUseCase(this.prisma),
      unlinkProviderUseCase: new TestUnlinkProviderUseCase(this.prisma),
      getUserByIdAdminUseCase: new TestGetUserByIdAdminUseCase(this.prisma),
      setUserRoleAdminUseCase: new TestSetUserRoleAdminUseCase(this.prisma),
      setUserStatusAdminUseCase: new TestSetUserStatusAdminUseCase(this.prisma),
      getUsersAdminUseCase: new TestGetUsersAdminUseCase(this.prisma)
    };
  }

  /**
   * Creates handlers with all dependencies
   * @returns Object containing all handlers
   */
  createHandlers() {
    // Use the test handlers that use TestCompositionRoot
    // This ensures we use the test database and mocked AWS services
    return {
      patchMeHandler: testPatchMeHandler,
      linkProviderHandler: testLinkProviderHandler,
      getMeHandler: testGetMeHandler,
      unlinkProviderHandler: testUnlinkProviderHandler,
      getUserByIdAdminHandler: testGetUserByIdAdminHandler,
      setUserRoleAdminHandler: testSetUserRoleAdminHandler,
      setUserStatusAdminHandler: testSetUserStatusAdminHandler,
      getUsersAdminHandler: testGetUsersAdminHandler
    };
  }

  /**
   * Gets the Prisma client instance
   * @returns PrismaClient instance
   */
  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Gets the outbox repository for event verification
   * @returns InMemoryOutboxRepository instance
   */
  getOutboxRepository(): InMemoryOutboxRepository {
    return this.outboxRepository;
  }

  /**
   * Gets the fake logger for log verification
   * @returns FakeLogger instance
   */
  getLogger(): FakeLogger {
    return this.logger;
  }

  /**
   * Gets the fake Cognito service
   * @returns FakeCognitoService instance
   */
  getCognitoService(): FakeCognitoService {
    return this.cognitoService;
  }

  /**
   * Clears all test data and resets mocks
   */
  async clearTestData(): Promise<void> {
    // Clear database test data
    await this.prisma.oAuthAccount.deleteMany({});
    await this.prisma.userPersonalInfo.deleteMany({});
    await this.prisma.userAuditEvent.deleteMany({});
    await this.prisma.user.deleteMany({});
    
    // Clear outbox events
    this.outboxRepository.clear();
    
    // Clear logs
    this.logger.clear();
    
    // Clear Cognito users
    this.cognitoService.clear();
  }

  /**
   * Closes the Prisma client connection
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }

  /**
   * Resets the singleton instance (for test cleanup)
   */
  static reset(): void {
    if (TestCompositionRoot.instance) {
      TestCompositionRoot.instance.close();
      TestCompositionRoot.instance = null as any;
    }
  }
}

/**
 * Convenience function to get the test composition root
 * @returns TestCompositionRoot instance
 */
export function getTestCompositionRoot(): TestCompositionRoot {
  return TestCompositionRoot.getInstance();
}

/**
 * Convenience function to create a handler for testing
 * @param handlerName - Name of the handler to create
 * @returns Handler function
 */
export function createTestHandler(handlerName: 'patchMeHandler') {
  const compositionRoot = getTestCompositionRoot();
  const handlers = compositionRoot.createHandlers();
  
  return handlers[handlerName];
}

/**
 * Convenience function to get test utilities
 * @returns Object containing test utilities
 */
export function getTestUtilities() {
  const compositionRoot = getTestCompositionRoot();
  
  return {
    prisma: compositionRoot.getPrismaClient(),
    outboxRepository: compositionRoot.getOutboxRepository(),
    logger: compositionRoot.getLogger(),
    cognitoService: compositionRoot.getCognitoService(),
    clearTestData: () => compositionRoot.clearTestData()
  };
}
