/**
 * @fileoverview Factories Barrel Export
 * @summary Centralized exports for all factory components
 * @description Provides clean imports for all factory functionality including
 * repositories, services, use cases, infrastructure, and composition root
 */

export { RepositoryFactory } from './repositories';
export { ServiceFactory } from './services';
export { InfrastructureFactory } from './infrastructure';
export { UseCaseFactory } from './use-cases';
export { CompositionRoot } from './CompositionRoot';
export { IntegrationEventFactory } from './events/IntegrationEventFactory';
