/**
 * @file MakeConsentQueryPort.ts
 * @summary App adapter: ConsentRepository → ConsentQueriesPort
 * @description Bridges the infra repository to the app queries port for consent listing operations.
 * Maps repository rows to domain types and handles enum validation using shared validations.
 */

import type { ConsentQueriesPort } from "../../ports/consent/ConsentQueriesPort";
import type { 
  GetConsentAppInput, 
  GetConsentAppResult,
  ListConsentsAppInput,
  ListConsentsAppResult 
} from "../../../domain/types/consent/AppServiceInputs";
import type { ConsentQueryRepo } from "../../../domain/types/consent/AdapterDependencies";
import { mapConsentRowToResult, mapConsentRowToListItem } from "../../../domain/types/consent/ConsentTypes";
import { PAGINATION_LIMITS } from "../../../domain/values/enums";

/**
 * @summary Creates a ConsentQueriesPort implementation
 * @description Factory function that creates a ConsentQueriesPort implementation
 * by bridging the infrastructure repository to the application port interface.
 * Handles mapping between repository and domain types.
 *
 * @param {ConsentQueryRepo} repo - Repository implementation for consent operations
 * @returns {ConsentQueriesPort} ConsentQueriesPort implementation
 */
export const makeConsentQueryPort = (repo: ConsentQueryRepo): ConsentQueriesPort => ({
  /**
   * @summary Gets a consent by its ID
   * @description Retrieves a specific consent record by its unique identifier
   *
   * @param {GetConsentAppInput} input - Input parameters containing tenant, envelope, and consent IDs
   * @returns {Promise<GetConsentAppResult | null>} Promise resolving to the consent data or null if not found
   */
  async getById(input: GetConsentAppInput): Promise<GetConsentAppResult | null> {
    const row = await repo.getById({
      envelopeId: input.envelopeId,
      consentId: input.consentId,
    });

    if (!row) {
      return null;
    }

    return mapConsentRowToResult(row);
  },

  /**
   * @summary Lists consents by envelope with optional filtering and pagination
   * @description Queries consent records for a given envelope with optional filtering
   * by status, consent type, and party ID. Supports pagination with cursor-based navigation.
   *
   * @param {ListConsentsAppInput} input - Input parameters including envelope ID and optional filters
   * @returns {Promise<ListConsentsAppResult>} Promise resolving to paginated consent records
   */
  async listByEnvelope(input: ListConsentsAppInput): Promise<ListConsentsAppResult> {
    const out = await repo.listByEnvelope({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
      limit: input.limit ?? PAGINATION_LIMITS.DEFAULT_LIMIT,
      cursor: input.cursor,
      status: input.status,
      consentType: input.type,
      partyId: input.partyId,
    });

    return {
      envelopeId: input.envelopeId,
      items: out.items.map(mapConsentRowToListItem),
      meta: { 
        limit: out.meta.limit, 
        nextCursor: out.meta.nextCursor, 
        total: out.meta.total 
      },
    };
  },
});
