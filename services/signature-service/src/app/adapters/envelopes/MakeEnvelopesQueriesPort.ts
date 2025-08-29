/**
 * @file MakeEnvelopesQueriesPort.adapter.ts
 * @summary Factory for EnvelopesQueriesPort
 * @description Creates and configures the EnvelopesQueriesPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for envelope query operations.
 */

import type { Repository } from "@lawprotect/shared-ts";
import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import type { EnvelopesQueriesPort, ListEnvelopesQuery, ListEnvelopesResult } from "@/app/ports/envelopes/EnvelopesQueriesPort";
import { getEnvelopeById } from "@/use-cases/envelopes/GetEnvelopeById";
import { listEnvelopes } from "@/use-cases/envelopes/ListEnvelopes";

/**
 * Creates an EnvelopesQueriesPort implementation
 * @param envelopesRepo - The envelope repository for data persistence
 * @returns Configured EnvelopesQueriesPort implementation
 */
export const makeEnvelopesQueriesPort = (
  envelopesRepo: Repository<Envelope, EnvelopeId> & {
    listByTenant(args: { tenantId: any; limit: number; cursor?: string }): Promise<{
      items: Envelope[];
      nextCursor?: string;
    }>;
  }
): EnvelopesQueriesPort => {
  return {
    /**
     * Retrieves an envelope by ID
     * @param envelopeId - The envelope ID to retrieve
     * @returns Promise resolving to envelope data or null
     */
    async getById(envelopeId: EnvelopeId): Promise<any> {
      const result = await getEnvelopeById(
        { envelopeId },
        { repos: { envelopes: envelopesRepo } }
      );
      return result.envelope;
    },

    /**
     * Lists envelopes by tenant with pagination
     * @param query - The query containing tenant ID and pagination options
     * @returns Promise resolving to paginated envelope list
     */
    async listByTenant(query: ListEnvelopesQuery): Promise<ListEnvelopesResult> {
      const result = await listEnvelopes(
        { tenantId: query.tenantId, limit: query.limit, cursor: query.cursor },
        { repos: { envelopes: envelopesRepo } }
      );
      return {
        items: result.items,
        nextCursor: result.nextCursor,
      };
    },
  };
};
