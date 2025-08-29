import type {
  ConsentsQueryPort, ListByEnvelopeInput, ListByEnvelopeOutput,
} from "@/domain/ports/consent/QueriesPort";
import type { ConsentRecord } from "@/domain/ports/consent/ConsentsPort";

import type {
  ConsentRepoListInput, ConsentRepoListOutput, ConsentRepoRow,
} from "@/adapters/shared/RepoTypes";

import { toConsentType, toConsentStatus } from "@/app/mapper/EnumMappers";

type ConsentsRepo = {
  listByEnvelope(input: ConsentRepoListInput): Promise<ConsentRepoListOutput>;
};

const mapRow = (r: ConsentRepoRow): ConsentRecord => ({
  consentId: r.consentId,
  envelopeId: r.envelopeId,
  partyId: r.partyId,
  consentType: toConsentType(r.consentType),
  status: toConsentStatus(r.status),
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  expiresAt: r.expiresAt,
  metadata: r.metadata,
});

export const makeConsentsQueryPort = (repo: ConsentsRepo): ConsentsQueryPort => ({
  async listByEnvelope(input: ListByEnvelopeInput): Promise<ListByEnvelopeOutput> {
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
});
