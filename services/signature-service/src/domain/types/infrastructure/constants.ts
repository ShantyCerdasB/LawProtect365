/**
 * @file constants.ts
 * @summary Infrastructure constants
 * @description Shared constants for infrastructure configuration and defaults
 */

/**
 * @summary Default GSI name for entity queries
 * @description Default Global Secondary Index name used for querying entities by envelope, tenant, etc.
 * Used across all repositories for consistent entity-based queries in single-table design.
 */
export const DEFAULT_ENTITY_INDEX = "gsi1";

/**
 * @summary Default GSI name for ID queries
 * @description Default Global Secondary Index name used for querying entities by unique ID.
 * Used across all repositories for consistent ID-based queries in single-table design.
 */
export const DEFAULT_ID_INDEX = "gsi2";






