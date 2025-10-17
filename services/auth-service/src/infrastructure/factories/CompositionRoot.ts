/**
 * @fileoverview CompositionRoot - Main composition root for the auth service
 * @summary Wires all dependencies and creates the complete object graph
 * @description Coordinates all factories to create the complete application object graph.
 * This is the single point of assembly for all dependencies following the Composition Root pattern.
 * It orchestrates the creation of repositories, services, and infrastructure components.
 */

import { RepositoryFactory } from './RepositoryFactory';
import { ServiceFactory } from './ServiceFactory';
import { AwsClientFactory } from './AwsClientFactory';
import { loadConfig } from '../../config/AppConfig';
import { createServiceLogger } from '../../utils/logger';
import { Logger } from '@lawprotect/shared-ts';
import { GetMeUseCase } from '../../application/GetMeUseCase';
import { LinkProviderUseCase } from '../../application/LinkProviderUseCase';
import { UnlinkProviderUseCase } from '../../application/UnlinkProviderUseCase';
import { GetUsersAdminUseCase } from '../../application/admin/GetUsersAdminUseCase';
import { GetUserByIdAdminUseCase } from '../../application/admin/GetUserByIdAdminUseCase';
import { SetUserStatusAdminUseCase } from '../../application/admin/SetUserStatusAdminUseCase';
import { SetUserRoleAdminUseCase } from '../../application/admin/SetUserRoleAdminUseCase';
import { PatchMeUseCase } from '../../application/users/PatchMeUseCase';

/**
 * Main composition root that assembles the complete object graph for the auth service.
 * Follows the Composition Root pattern by centralizing all dependency creation and wiring.
 */
export class CompositionRoot {
  public readonly logger: Logger;
  public readonly config: any;
  public readonly userService: any;
  public readonly cognitoService: any;
  public readonly auditService: any;
  public readonly eventPublishingService: any;
  public readonly userRepository: any;
  public readonly oauthAccountRepository: any;
  public readonly userAuditEventRepository: any;
  public readonly getMeUseCase: any;
  public readonly linkProviderUseCase: any;
  public readonly unlinkProviderUseCase: any;

  private constructor(
    logger: Logger,
    config: any,
    repositories: any,
    services: any,
    _infrastructure: any
  ) {
    this.logger = logger;
    this.config = config;
    this.userService = services.userService;
    this.cognitoService = services.cognitoService;
    this.auditService = services.auditService;
    this.eventPublishingService = services.eventPublishingService;
    this.userRepository = repositories.userRepository;
    this.oauthAccountRepository = repositories.oauthAccountRepository;
    this.userAuditEventRepository = repositories.userAuditEventRepository;
    
    // Create GetMeUseCase
    this.getMeUseCase = new GetMeUseCase(
      services.userService,
      repositories.oauthAccountRepository,
      logger
    );

    // Create LinkProviderUseCase
    this.linkProviderUseCase = new LinkProviderUseCase(
      services.userService,
      services.cognitoService,
      repositories.oauthAccountRepository,
      services.auditService,
      services.eventPublishingService,
      config,
      logger
    );

    // Create UnlinkProviderUseCase
    this.unlinkProviderUseCase = new UnlinkProviderUseCase(
      services.userService,
      services.cognitoService,
      repositories.oauthAccountRepository,
      services.auditService,
      services.eventPublishingService,
      config,
      logger
    );
  }

  /**
   * Creates the complete dependency graph for the auth service
   * @returns Fully configured service instances with all dependencies
   */
  static async build(): Promise<CompositionRoot> {
    // Create logger first
    const logger = createServiceLogger();

    // Load configuration
    const config = loadConfig();

    // Create repositories
    const repositories = RepositoryFactory.createAll();

    // Create infrastructure services
    const infrastructure = AwsClientFactory.createAll(logger);

    // Create domain services
    const services = ServiceFactory.createAll(repositories, infrastructure, logger);

    return new CompositionRoot(
      logger,
      config,
      repositories,
      services,
      infrastructure
    );
  }

  /**
   * Creates GetMeUseCase instance
   * @returns GetMeUseCase instance
   */
  static createGetMeUseCase(): any {
    const logger = createServiceLogger();
    const repositories = RepositoryFactory.createAll();
    const infrastructure = AwsClientFactory.createAll(logger);
    const services = ServiceFactory.createAll(repositories, infrastructure, logger);

    return new GetMeUseCase(
      services.userService,
      repositories.oauthAccountRepository,
      logger
    );
  }

  /**
   * Creates LinkProviderUseCase instance
   * @returns LinkProviderUseCase instance
   */
  static createLinkProviderUseCase(): any {
    const logger = createServiceLogger();
    const config = loadConfig();
    const repositories = RepositoryFactory.createAll();
    const infrastructure = AwsClientFactory.createAll(logger);
    const services = ServiceFactory.createAll(repositories, infrastructure, logger);

    return new LinkProviderUseCase(
      services.userService,
      services.cognitoService,
      repositories.oauthAccountRepository,
      services.auditService,
      services.eventPublishingService,
      config,
      logger
    );
  }

  /**
   * Creates UnlinkProviderUseCase instance
   * @returns UnlinkProviderUseCase instance
   */
  static createUnlinkProviderUseCase(): any {
    const logger = createServiceLogger();
    const config = loadConfig();
    const repositories = RepositoryFactory.createAll();
    const infrastructure = AwsClientFactory.createAll(logger);
    const services = ServiceFactory.createAll(repositories, infrastructure, logger);

    return new UnlinkProviderUseCase(
      services.userService,
      services.cognitoService,
      repositories.oauthAccountRepository,
      services.auditService,
      services.eventPublishingService,
      config,
      logger
    );
  }

  /**
   * Creates GetUsersAdminUseCase instance
   * @returns Configured GetUsersAdminUseCase instance
   */
  static createGetUsersAdminUseCase(): any {
    const logger = createServiceLogger();
    const repositories = RepositoryFactory.createAll();

    return new GetUsersAdminUseCase(
      repositories.userRepository,
      logger
    );
  }

  /**
   * Creates SetUserStatusAdminUseCase instance
   * @returns Configured SetUserStatusAdminUseCase instance
   */
  static createSetUserStatusAdminUseCase(): any {
    const logger = createServiceLogger();
    const repositories = RepositoryFactory.createAll();
    const infrastructure = AwsClientFactory.createAll(logger);
    const services = ServiceFactory.createAll(repositories, infrastructure, logger);

    return new SetUserStatusAdminUseCase(
      services.userService,
      services.cognitoService,
      services.auditService,
      services.eventPublishingService,
      repositories.userRepository,
      logger
    );
  }

  /**
   * Creates SetUserRoleAdminUseCase with all dependencies
   * @returns Configured SetUserRoleAdminUseCase instance
   */
  static createSetUserRoleAdminUseCase(): SetUserRoleAdminUseCase {
    const logger = createServiceLogger();
    const repositories = RepositoryFactory.createAll();
    const infrastructure = AwsClientFactory.createAll(logger);
    const services = ServiceFactory.createAll(repositories, infrastructure, logger);

    return new SetUserRoleAdminUseCase(
      services.userService,
      services.cognitoService,
      services.auditService,
      repositories.userRepository,
      logger
    );
  }

  /**
   * Creates GetUserByIdAdminUseCase with all dependencies
   * @returns Configured GetUserByIdAdminUseCase instance
   */
  static createGetUserByIdAdminUseCase(): GetUserByIdAdminUseCase {
    const logger = createServiceLogger();
    const repositories = RepositoryFactory.createAll();

    return new GetUserByIdAdminUseCase(
      repositories.userRepository,
      logger
    );
  }

  /**
   * Creates PatchMeUseCase with all dependencies
   * @returns Configured PatchMeUseCase instance
   */
  static createPatchMeUseCase(): PatchMeUseCase {
    const logger = createServiceLogger();
    const repositories = RepositoryFactory.createAll();
    const infrastructure = AwsClientFactory.createAll(logger);
    const services = ServiceFactory.createAll(repositories, infrastructure, logger);

    return new PatchMeUseCase(
      services.userService,
      services.auditService,
      logger
    );
  }
}
