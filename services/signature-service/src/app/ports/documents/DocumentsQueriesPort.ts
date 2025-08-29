/**
 * Read-only documents port for listing envelope documents with cursor pagination.
 * Controllers depend on this interface; infra stays behind adapters.
 */
import type { TenantId, EnvelopeId, Page, PageOpts } from "@/app/ports/shared";
import type { DocumentHead } from "@/app/ports/shared/documents";

export interface DocumentsQueriesPort {
  listByEnvelope(
    input: { tenantId: TenantId; envelopeId: EnvelopeId } & PageOpts
  ): Promise<Page<DocumentHead>>;
}
