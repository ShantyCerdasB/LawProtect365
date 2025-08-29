/**
 * Adapter: Envelope repo → EnvelopesQueriesPort.
 * The repo can be stricter/looser with enums; we cast to the app-head safely.
 */
import type { EnvelopesQueriesPort } from "./EnvelopeQueriesPort";
import type { EnvelopeHead, TenantId, EnvelopeId, Page, PageOpts, EnvelopeStatus } from "@/app/ports/shared";

type EnvelopeRow = {
  envelopeId: EnvelopeId | string;
  tenantId: TenantId | string;
  status: EnvelopeStatus | string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
};

type EnvelopeRepo = {
  getById(id: EnvelopeId): Promise<EnvelopeRow | null>;
  listByTenant(input: { tenantId: TenantId; status?: EnvelopeStatus | string } & PageOpts): Promise<Page<EnvelopeRow>>;
};

export const makeEnvelopesQueriesPort = (repo: EnvelopeRepo): EnvelopesQueriesPort => ({
  async getById(id): Promise<EnvelopeHead | null> {
    const row = await repo.getById(id);
    if (!row) return null;
    return {
      envelopeId: row.envelopeId as EnvelopeId,
      tenantId: row.tenantId as TenantId,
      status: row.status as EnvelopeStatus,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  async listByTenant(input): Promise<Page<EnvelopeHead>> {
    const page = await repo.listByTenant(input);
    return {
      items: page.items.map((row) => ({
        envelopeId: row.envelopeId as EnvelopeId,
        tenantId: row.tenantId as TenantId,
        status: row.status as EnvelopeStatus,
        title: row.title,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      nextCursor: page.nextCursor,
    };
  },
});
