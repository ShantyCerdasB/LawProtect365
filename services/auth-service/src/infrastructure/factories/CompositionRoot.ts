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
    const infrastructure = AwsClientFactory.createAll();

    // Create domain services
    const services = ServiceFactory.createAll(repositories, infrastructure);

    return new CompositionRoot(
      logger,
      config,
      repositories,
      services,
      infrastructure
    );
  }
}
