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

}
