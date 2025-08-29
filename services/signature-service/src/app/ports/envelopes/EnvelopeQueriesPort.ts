/**
 * Read-only envelope port for controllers/use-cases.
 */
import type { EnvelopeHead, TenantId, EnvelopeId, Page, PageOpts, EnvelopeStatus } from "@/app/ports/shared/index";

export interface EnvelopesQueriesPort {
  getById(id: EnvelopeId): Promise<EnvelopeHead | null>;

  listByTenant(
    input: { tenantId: TenantId; status?: EnvelopeStatus } & PageOpts
  ): Promise<Page<EnvelopeHead>>;
}
