/**
 * @file queries.ts
 * @summary Domain port for read/list operations on consents.
 *
 * @remarks
 * - This file is domain-level. Do not import HTTP/Zod here.
 * - Keeps types aligned with ConsentRecord/Status/Type.
 */

import type { ConsentRecord, ConsentStatus, ConsentType } from "./ConsentsPort";

/** Input for listing consents within an envelope (domain-level). */
export type ListByEnvelopeInput = {
  envelopeId: string;
  limit?: number;
  cursor?: string;
  status?: ConsentStatus;
  consentType?: ConsentType;
  partyId?: string;
};

/** Output for listing consents (domain-level). */
export type ListByEnvelopeOutput = {
  items: ConsentRecord[];
  meta: {
    limit: number;
    nextCursor?: string;
    total?: number;
  };
};

/** Read-only port for consent queries. */
export interface ConsentsQueryPort {
  listByEnvelope(input: ListByEnvelopeInput): Promise<ListByEnvelopeOutput>;
}
