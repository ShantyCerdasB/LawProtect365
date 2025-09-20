/**
 * @fileoverview Infrastructure types index - Exports all infrastructure type definitions
 * @summary Central export point for DynamoDB and other infrastructure types
 * @description Provides centralized access to all infrastructure-related type definitions
 * including DynamoDB item structures, mappers, and utility functions.
 */

// Common infrastructure types
export * from './common';

// Entity-specific infrastructure types
export * from './envelope';
export * from './audit';
export * from './consent';
export * from './signature';
export * from './signer';
export * from './invitation-token';
export * from '../document-access';
export * from '../envelope-service';
