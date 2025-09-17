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

// Value Objects
export * from './value-objects';

// Types (excluding infrastructure to avoid conflicts)
export { CreateAuditEventRequest } from './types/audit';
export type { AuditEvent as AuditEventType } from './types/audit';
export * from './types/envelope';
export * from './types/signing';
export * from './types/WorkflowTypes';
export * from './types/signature';
export * from './types/signer';
export * from './types/invitation-token';
export * from './types/consent';

// Infrastructure types (explicit exports to avoid conflicts)
export * from './types/infrastructure/common';
export * from './types/infrastructure/envelope';
export * from './types/infrastructure/consent';
export * from './types/infrastructure/signature';
export * from './types/infrastructure/signer';
export * from './types/infrastructure/invitation-token';
export * from './types/infrastructure/audit';
// Note: Outbox types are exported from entities and enums, avoiding duplicate exports

// Schemas (commented to avoid conflicts with types)
// export * from './schemas';

// Rules
export * from './rules';

// Validators
export * from './validators';