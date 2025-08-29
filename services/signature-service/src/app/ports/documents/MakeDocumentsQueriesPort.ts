/**
 * Adapter: DocumentRepository → DocumentsQueriesPort.
 * - Uses repo.listByEnvelope if available; otherwise returns an empty page.
 * - Normalizes repository rows into DocumentHead.
 * - Keeps cursor opaque (passes through nextCursor).
 */
import type { DocumentsQueriesPort } from "./DocumentsQueriesPort";
import type { DocumentHead } from "@/app/ports/shared/documents";
import type { TenantId, EnvelopeId, Page, PageOpts } from "@/app/ports/shared";
import { toIso } from "@lawprotect/shared-ts";

/** Flexible upstream row (repos may vary field names). */
type RepoRow = {
  id?: string;
  documentId?: string;
  docId?: string;

  name?: string;
  title?: string;

  contentType?: string;
  createdAt?: string | Date | number;
};

type RepoListInput  = { tenantId: TenantId; envelopeId: EnvelopeId } & PageOpts;
type RepoListOutput = Page<RepoRow>;

/**
 * Compatible repo shape. The index signature keeps this adapter infra-agnostic
 * and avoids “no properties in common” when passing a concrete class.
 */
type DocumentsRepoLike = Record<string, unknown> & {
  listByEnvelope?: (input: RepoListInput) => Promise<RepoListOutput>;
};

export const makeDocumentsQueriesPort = (repo: DocumentsRepoLike): DocumentsQueriesPort => ({
  async listByEnvelope(input) {
    if (typeof repo.listByEnvelope !== "function") {
      return { items: [], nextCursor: undefined };
    }

    const page = await repo.listByEnvelope(input);

    const items: DocumentHead[] = (page.items ?? []).map((r) => ({
      id: r.id ?? r.documentId ?? r.docId ?? "",
      name: r.name ?? r.title ?? "",
      contentType: r.contentType ?? "",
      createdAt:
        typeof r.createdAt === "string"
          ? r.createdAt
          : r.createdAt != null
            ? toIso(r.createdAt as Date | number)
            : "",
    }));

    return { items, nextCursor: page.nextCursor };
  },
});
