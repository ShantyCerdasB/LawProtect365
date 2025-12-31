/**
 * @fileoverview Domain barrel export - Exports all domain components
 * @summary Centralized exports for the entire domain layer
 * @description This barrel file exports all domain components (entities, enums, 
 * value objects, types, and schemas) for easy importing throughout the application.
 */

// Entities
export * from './entities';

// Enums
export * from './enums';

// Constants
export * from './constants';

// Value Objects
export * from './value-objects';

// Types (excluding infrastructure to avoid conflicts)
export * from './types/envelope';
export * from './types/signer';
export * from './types/invitation-token';
export * from './types/consent';
export * from './types/orchestrator';

// Rules
export * from './rules';

