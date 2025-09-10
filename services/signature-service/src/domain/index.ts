/**
 * @file index.ts
 * @summary Domain layer exports
 * @description Central export file for all domain layer components
 */

// Entities
export * from "./entities";

// Value Objects (excluding conflicting exports)
export * from "./value-objects/ids";
export * from "./value-objects/common";
export * from "./value-objects/document";
export * from "./value-objects/consent";
export * from "./value-objects/audit";

// Global party value objects - no exports needed
export * from "./value-objects/party/index";

// Domain Services
export * from "./services";

// Domain Types
export * from "./types";

// Domain Rules
export * from "./rules";

// Domain Constants
export * from "./constants";

// Domain Contracts
export * from "./contracts";

// Domain Values/Enums (excluding conflicting exports)
// Note: KmsAlgorithm is exported from value-objects to avoid conflicts
// PartyRole is now properly exported from values/enums

