/**
 * @file index.ts
 * @summary Shared layer exports
 * @description Central export file for truly shared components across the application
 */

// Shared errors (domain-specific but used across layers)
export * from "./errors";

// Shared validations (domain-specific but used across layers)

// Shared controllers (generic controller factories)
export * from "./controllers";

// Shared contracts - moved to appropriate locations
// - Generic contracts: packages/shared-ts/src/contracts/
// - Domain contracts: domain/contracts/
// - Infrastructure contracts: infrastructure/contracts/



