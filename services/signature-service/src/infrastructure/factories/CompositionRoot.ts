/**
 * @fileoverview CompositionRoot - Main composition root for the signature service
 * @summary Wires all dependencies and creates the complete object graph
 * @description Coordinates all factories to create the complete application object graph.
 * This is the single point of assembly for all dependencies following the Composition Root pattern.
 * It orchestrates the creation of repositories, services, use cases, and infrastructure components.
 */

import { SignatureOrchestrator } from '../../services/orchestrators/SignatureOrchestrator';

import { RepositoryFactory } from './repositories';
import { ServiceFactory } from './services';
import { InfrastructureFactory } from './infrastructure';
import { UseCaseFactory } from './use-cases';

/**
 * Main composition root that assembles the complete object graph for the signature service.
 * Follows the Composition Root pattern by centralizing all depensdency creation and wiring.
 */
export class CompositionRoot {
  /**
   * Creates the complete SignatureOrchestrator with all dependencies
   * @returns Fully configured SignatureOrchestrator instance
   */
  static createSignatureOrchestrator(): SignatureOrchestrator {
    // Create repositories
    const repositories = RepositoryFactory.createAll();

    // Create infrastructure services
    const infrastructure = InfrastructureFactory.createAll();

    // Create domain services
    const domainServices = ServiceFactory.createAll(repositories, infrastructure);

    // Bundle all services (domain + infrastructure)
    const services = {
      ...domainServices,
      auditEventService: infrastructure.auditEventService,
      s3Service: infrastructure.s3Service,
      kmsService: infrastructure.kmsService,
    };

    // Create all use cases
    const useCases = UseCaseFactory.createAll(services);

    // Create orchestrator with complete dependency graph
    return new SignatureOrchestrator({
      services,
      useCases,
    });
  }

  /**
   * Async variant that wires the full object graph ensuring DB configuration is available.
   *
   * Rationale:
   * - Some environments don't set `DATABASE_URL` until runtime (resolved from Secrets Manager).
   * - Building repositories here prevents module import from failing during cold start.
   * Use this method inside Lambda handlers right before the first DB access.
   */
  static async createSignatureOrchestratorAsync(): Promise<SignatureOrchestrator> {
    const repositories = await RepositoryFactory.createAllAsync();
    const infrastructure = InfrastructureFactory.createAll();
    const domainServices = ServiceFactory.createAll(repositories, infrastructure);
    const services = {
      ...domainServices,
      auditEventService: infrastructure.auditEventService,
      s3Service: infrastructure.s3Service,
      kmsService: infrastructure.kmsService,
    };
    const useCases = UseCaseFactory.createAll(services);
    return new SignatureOrchestrator({ services, useCases });
  }
}
