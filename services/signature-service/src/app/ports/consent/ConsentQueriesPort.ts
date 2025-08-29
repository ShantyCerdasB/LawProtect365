/**
 * @file ConsentQueriesPort.ts
 * @summary Port interface for consent query operations
 * @description Defines the interface for read-only consent operations including listing and filtering
 */

import type { ConsentId, TenantId, EnvelopeId } from "../shared";
import type { Page } from "../shared/common/pagination";
import type { ConsentHead } from "../shared/consents/types.consent";

/**
 * Input parameters for listing consents by envelope
 */
export interface ListConsentsQuery {
  /** The tenant ID that owns the consents */
  tenantId: TenantId;
  /** The envelope ID to filter consents by */
  envelopeId: EnvelopeId;
  /** Maximum number of consents to return (optional) */
  limit?: number;
  /** Pagination cursor for getting the next page of results (optional) */
  cursor?: string;
  /** Filter by consent status (optional) */
  status?: string;
  /** Filter by consent type (optional) */
  consentType?: string;
  /** Filter by party ID (optional) */
  partyId?: string;
}

/**
 * Result of listing consents
 */
export interface ListConsentsResult extends Page<ConsentHead> {}

/**
 * Port interface for consent query operations
 * 
 * This port defines the contract for read-only consent operations.
 * Implementations should handle the business logic for querying and
 * filtering consents without modifying them.
 */
export interface ConsentQueriesPort {
  /**
   * Lists consents by envelope with optional filtering and pagination
   * 
   * @param query - The query parameters containing filtering and pagination options
   * @returns Promise resolving to paginated consent list
   */
  listByEnvelope(query: ListConsentsQuery): Promise<ListConsentsResult>;

  /**
   * Gets a consent by its ID
   * 
   * @param consentId - The unique identifier of the consent to retrieve
   * @returns Promise resolving to the consent data or null if not found
   */
  getById(consentId: ConsentId): Promise<ConsentHead | null>;
}
