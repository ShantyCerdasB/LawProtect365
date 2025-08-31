/**
 * @file MakeConsentQueryPort.ts
 * @summary App adapter: ConsentRepository → ConsentQueriesPort
 * @description Bridges the infra repository to the app queries port for consent listing operations.
 * Maps repository rows to domain types and handles enum validation using shared validations.
 */

import type { ConsentQueriesPort, ListConsentsQuery, ListConsentsResult } from "@/app/ports/consent/ConsentQueriesPort";
import type { ConsentHead } from "@/shared/types/consent";
import type { ConsentRepoListInput, ConsentRepoListOutput, ConsentRepoRow } from "@/shared/types/consent";
import { validateConsentType, validateConsentStatus } from "@/shared/validations/consent.validations";

/**
 * @summary Minimal repository interface required by this adapter
 * @description Defines the repository methods needed for consent query operations
 */
type ConsentsRepo = {
  listByEnvelope(input: ConsentRepoListInput): Promise<ConsentRepoListOutput>;
};

/**
 * @summary Maps a repository row to a consent head record
 * @description Converts a repository row to the domain consent head format,
 * validating enum values using shared validation functions.
 *
 * @param {ConsentRepoRow} r - Repository row from database
 * @returns {ConsentHead} Domain consent head record
 */
const mapRow = (r: ConsentRepoRow): ConsentHead => ({
  consentId: r.consentId,
  envelopeId: r.envelopeId as any,
  partyId: r.partyId as any,
  tenantId: r.tenantId as any,
  consentType: validateConsentType(r.consentType),
  status: validateConsentStatus(r.status),
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  expiresAt: r.expiresAt,
});

/**
 * @summary Creates a ConsentQueriesPort implementation
 * @description Factory function that creates a ConsentQueriesPort implementation
 * by bridging the infrastructure repository to the application port interface.
 * Handles mapping between repository and domain types.
 *
 * @param {ConsentsRepo} repo - Repository implementation for consent operations
 * @returns {ConsentQueriesPort} ConsentQueriesPort implementation
 */
export const makeConsentsQueryPort = (repo: ConsentsRepo): ConsentQueriesPort => ({
  /**
   * @summary Lists consents by envelope with optional filtering and pagination
   * @description Queries consent records for a given envelope with optional filtering
   * by status, consent type, and party ID. Supports pagination with cursor-based navigation.
   *
   * @param {ListConsentsQuery} input - Query parameters including envelope ID and optional filters
   * @returns {Promise<ListConsentsResult>} Promise resolving to paginated consent records
   */
  async listByEnvelope(input: ListConsentsQuery): Promise<ListConsentsResult> {
    const out = await repo.listByEnvelope({
      envelopeId: input.envelopeId,
      limit: input.limit,
      cursor: input.cursor,
      status: input.status,
      consentType: input.consentType,
      partyId: input.partyId,
    });

    return {
      items: out.items.map(mapRow),
      meta: { limit: out.meta.limit, nextCursor: out.meta.nextCursor, total: out.meta.total },
    };
  },

  /**
   * @summary Gets a consent by its ID
   * @description Retrieves a specific consent record by its unique identifier.
   * Currently not implemented - would require additional repository method.
   *
   * @param {string} consentId - The unique identifier of the consent to retrieve
   * @returns {Promise<ConsentHead | null>} Promise resolving to the consent data or null if not found
   */
  async getById(consentId: string): Promise<ConsentHead | null> {
    // TODO: Implement when repository supports getById by consentId only
    throw new Error("getById not implemented - requires repository enhancement");
  },
});
