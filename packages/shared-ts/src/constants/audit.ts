/**
 * @file audit.ts
 * @summary Audit-related constants for shared use across microservices
 * @description Centralized constants for audit operations, system actors, and default values
 */

/**
 * @summary System actor identifier for automated operations
 * @description Used when no specific user actor is available for audit events
 */
export const SYSTEM_ACTOR = "system" as const;

/**
 * @summary Default pagination limits for audit operations
 * @description Standard pagination configuration for audit trail queries
 */
export const AUDIT_PAGINATION_DEFAULTS = {
  /** Default page size for audit queries */
  DEFAULT_LIMIT: 50,
  /** Maximum allowed page size for audit queries */
  MAX_LIMIT: 100,
  /** Minimum allowed page size for audit queries */
  MIN_LIMIT: 1} as const;

/**
 * @summary Audit event validation constants
 * @description Constants used for audit event validation and processing
 */
export const AUDIT_VALIDATION = {
  /** Maximum length for audit event metadata */
  MAX_METADATA_SIZE: 10000,
  /** Maximum length for actor information */
  MAX_ACTOR_INFO_LENGTH: 1000} as const;

/**
 * @summary Hash chain validation constants
 * @description Constants for validating audit event hash chains
 */
export const HASH_CHAIN_VALIDATION = {
  /** Expected hash length for SHA-256 */
  SHA256_LENGTH: 64,
  /** Maximum number of events to validate in a single chain */
  MAX_CHAIN_LENGTH: 10000} as const;
