/**
 * Adapter: Party repo → PartiesQueriesPort.
 */
import type { PartiesQueriesPort } from "./PartiesQueriesPort";
import type { PartyHead, TenantId, EnvelopeId, PartyId, Page, PageOpts, PartyRole, PartyStatus, PartyRow } from "@/app/ports/shared";


type PartyRepo = {
  getById(keys: { envelopeId: EnvelopeId; partyId: PartyId }): Promise<PartyRow | null>;
  listByEnvelope?(input: { tenantId: TenantId; envelopeId: EnvelopeId } & PageOpts): Promise<Page<PartyRow>>;
};

export const makePartiesQueriesPort = (repo: PartyRepo): PartiesQueriesPort => ({
  async getById(keys): Promise<PartyHead | null> {
    const row = await repo.getById(keys);
    if (!row) return null;
    return {
      partyId: row.partyId as PartyId,
      envelopeId: row.envelopeId as EnvelopeId,
      email: row.email,
      name: row.name,
      role: row.role as PartyRole | undefined,
      status: row.status as PartyStatus | undefined,
      order: row.order,
    };
  },

  async listByEnvelope(input): Promise<Page<PartyHead>> {
    if (typeof repo.listByEnvelope !== "function") return { items: [], nextCursor: undefined };
    const page = await repo.listByEnvelope(input);
    return {
      items: page.items.map((r) => ({
        partyId: r.partyId as PartyId,
        envelopeId: r.envelopeId as EnvelopeId,
        email: r.email,
        name: r.name,
        role: r.role as PartyRole | undefined,
        status: r.status as PartyStatus | undefined,
        order: r.order,
      })),
      nextCursor: page.nextCursor,
    };
  },
});
