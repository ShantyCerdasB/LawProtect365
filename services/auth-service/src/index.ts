/**
 * @fileoverview Auth Service - Main barrel export
 * @summary Centralized exports for the entire auth-service
 * @description This is the main entry point for the auth-service module.
 * It exports all public APIs including handlers, services, domain entities, and types.
 */

// Handlers
export * from './handlers';

// Services
export * from './services';

// Application layer (use cases and orchestrators)
export * from './application';

// Domain layer
export * from './domain';

// Infrastructure
export * from './infrastructure';

// Repositories
export * from './repositories';

// Triggers
export * from './triggers';

// Types
export * from './types';

// Config
export * from './config';

// Auth Errors
export * from './auth-errors';
