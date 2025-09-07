/**
 * @file index.ts
 * @summary Shared types exports
 * @description Central export file for all shared types used across the application
 */

// Infrastructure types
export * from "./infrastructure/dynamodb";
export * from "./infrastructure/aws";
export * from "./infrastructure/s3";
export * from "./infrastructure/kms";
export * from "./infrastructure/eventbridge";
export * from "./infrastructure/constants";
export * from "./infrastructure/enums";



// Common types
export * from "./common";



// Consent types
export * from "./consent";

// Inputs types
export * from "./inputs";

// Requests types
export * from "./requests";
export * from "./certificate";

// Audit types
export * from "./audit";

// Actor context moved to src/domain/entities/

// Validation schemas moved to src/shared/validations/

// Core types - moved to shared/contracts/core/Config.ts
