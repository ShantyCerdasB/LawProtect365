/**
 * Adapter: PartyRepository → PartiesPort (pre-bound to an envelopeId).
 *
 * - Always implements `getById(partyId)` using the repo’s composite key.
 * - Implements `listByEnvelope` **only if** the repo supports it; otherwise returns an empty page.
 * - Uses domain enums for role/status mapping.
 */
import type { PartiesPort } from "./PartiesPort";
import type {
  PartyHead,
  TenantId,
  EnvelopeId,
  PartyId,
  Page,
  PageOpts,
  PartyRow,
} from "@/app/ports/shared";
import type { PartyRole, PartyStatus } from "@/domain/values/enums";

/** Minimal row shape we expect from the infra repository. */


/** Minimal repo capabilities used by this adapter. */
type PartyRepo = {
  getById(keys: { envelopeId: EnvelopeId; partyId: PartyId }): Promise<PartyRow | null>;
  listByEnvelope?(
    input: { tenantId: TenantId; envelopeId: EnvelopeId } & PageOpts
  ): Promise<Page<PartyRow>>;
};

/** Local helper to normalize a repo row into the `PartyHead` view. */
const toHead = (r: PartyRow): PartyHead => ({
  partyId: r.partyId as PartyId,
  envelopeId: r.envelopeId as EnvelopeId,
  email: r.email,
  name: r.name,
  role: r.role as PartyRole | undefined,
  status: r.status as PartyStatus | undefined,
  order: r.order,
});

/**
 * Create a pre-bound parties port for a specific envelope.
 */
export const makePartiesPort = (
  repo: PartyRepo,
  envelopeId: EnvelopeId
): PartiesPort => ({
  async getById(partyId): Promise<PartyHead | null> {
    const row = await repo.getById({ envelopeId, partyId });
    return row ? toHead(row) : null;
  },

  async listByEnvelope(input): Promise<Page<PartyHead>> {
    if (typeof repo.listByEnvelope !== "function") {
      return { items: [], nextCursor: undefined };
    }
    const page = await repo.listByEnvelope({ ...input, envelopeId });
    return {
      items: page.items.map(toHead),
      nextCursor: page.nextCursor,
    };
  },
});
