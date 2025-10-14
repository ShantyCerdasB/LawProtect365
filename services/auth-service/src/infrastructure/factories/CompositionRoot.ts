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

/**
 * Main composition root that assembles the complete object graph for the auth service.
 * Follows the Composition Root pattern by centralizing all dependency creation and wiring.
 */
export class CompositionRoot {
  /**
   * Creates the complete dependency graph for the auth service
   * @returns Fully configured service instances with all dependencies
   */
  static async build() {
    // Load configuration
    const config = loadConfig();

    // Create repositories
    const repositories = RepositoryFactory.createAll();

    // Create infrastructure services
    const infrastructure = AwsClientFactory.createAll();

    // Create domain services
    const services = ServiceFactory.createAll(repositories, infrastructure);

    return {
      // Configuration
      config,
      
      // Repositories
      ...repositories,
      
      // Services
      ...services,
      
      // Infrastructure
      ...infrastructure,
    };
  }
}
