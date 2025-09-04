/**
 * @file EnvelopesQueryService.ts
 * @summary Query service for envelope operations
 * @description Simple wrapper service for envelope query operations
 */

import type { EnvelopesQueriesPort } from "../../ports/envelopes/EnvelopesQueriesPort";
import type { GetEnvelopeQuery, GetEnvelopeResult, ListEnvelopesQuery, ListEnvelopesResult, GetEnvelopeStatusQuery, GetEnvelopeStatusResult } from "../../ports/envelopes/EnvelopesQueriesPort";

/**
 * @summary Query service for envelope operations
 * @description Simple wrapper service that delegates to the queries port
 */
export class EnvelopesQueryService {
  constructor(private readonly queriesPort: EnvelopesQueriesPort) {}

  /**
   * @summary Gets an envelope by ID
   * @param query - Query data for getting an envelope
   * @returns Promise resolving to the envelope or null
   */
  async getById(query: GetEnvelopeQuery): Promise<GetEnvelopeResult> {
    return this.queriesPort.getById(query);
  }

  /**
   * @summary Lists envelopes with optional filters
   * @param query - Query data for listing envelopes
   * @returns Promise resolving to paginated list of envelopes
   */
  async list(query: ListEnvelopesQuery): Promise<ListEnvelopesResult> {
    return this.queriesPort.list(query);
  }

  /**
   * @summary Gets envelope status
   * @param query - Query data for getting envelope status
   * @returns Promise resolving to envelope status
   */
  async getStatus(query: GetEnvelopeStatusQuery): Promise<GetEnvelopeStatusResult> {
    return this.queriesPort.getStatus(query);
  }
}
