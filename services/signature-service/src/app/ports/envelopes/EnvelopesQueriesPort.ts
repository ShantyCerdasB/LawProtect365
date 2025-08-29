/**
 * @file EnvelopesQueriesPort.ts
 * @summary Port for envelope query operations
 * @description Defines the interface for read-only operations on envelopes.
 * This port provides methods to retrieve envelope data without modifying it.
 * Used by application services to query envelope information.
 */

import type { TenantId, EnvelopeId } from "../shared";

/**
 * Query parameters for listing envelopes by tenant
 */
export interface ListEnvelopesQuery {
  /** The tenant ID to filter envelopes by */
  tenantId: TenantId;
  /** Maximum number of envelopes to return (optional) */
  limit?: number;
  /** Pagination cursor for getting the next page of results (optional) */
  cursor?: string;
}

/**
 * Result of listing envelopes with pagination support
 */
export interface ListEnvelopesResult {
  /** Array of envelope data */
  items: any[];
  /** Cursor for the next page of results (optional) */
  nextCursor?: string;
}

/**
 * Port interface for envelope query operations
 * 
 * This port defines the contract for read-only operations on envelopes.
 * Implementations should provide efficient data retrieval without side effects.
 */
export interface EnvelopesQueriesPort {
  /**
   * Retrieves a single envelope by its ID
   * @param envelopeId - The unique identifier of the envelope
   * @returns Promise resolving to envelope data or null if not found
   */
  getById(envelopeId: EnvelopeId): Promise<any>;

  /**
   * Lists envelopes for a specific tenant with pagination support
   * @param query - Query parameters including tenant ID and pagination options
   * @returns Promise resolving to paginated list of envelopes
   */
  listByTenant(query: ListEnvelopesQuery): Promise<ListEnvelopesResult>;
}
