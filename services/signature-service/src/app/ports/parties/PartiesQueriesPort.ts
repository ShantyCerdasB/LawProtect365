/**
 * Read-only party port for controllers/use-cases.
 */
import type { PartyHead, TenantId, EnvelopeId, PartyId, Page, PageOpts } from "@/app/ports/shared";

export interface PartiesQueriesPort {
  getById(keys: { envelopeId: EnvelopeId; partyId: PartyId }): Promise<PartyHead | null>;

  listByEnvelope(input: { tenantId: TenantId; envelopeId: EnvelopeId } & PageOpts): Promise<Page<PartyHead>>;
}
