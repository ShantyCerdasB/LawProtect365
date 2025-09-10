/**
 * @file AdapterDependencies.ts
 * @summary Dependencies interfaces for party adapters
 * @description Defines the dependency contracts for party adapter implementations
 */

/**
 * @summary ID generation service interface
 * @description Service for generating unique identifiers
 */
export type Ids = { ulid(): string };

