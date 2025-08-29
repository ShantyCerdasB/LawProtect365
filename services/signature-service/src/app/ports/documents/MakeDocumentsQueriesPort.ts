/**
 * Adapter: DocumentRepository → DocumentsQueriesPort.
 * - Uses repo.listByEnvelope if available; otherwise returns an empty page.
 * - Normalizes repository rows into DocumentHead.
 * - Keeps cursor opaque (passes through nextCursor).
 */
import type { DocumentsQueriesPort } from "./DocumentsQueriesPort";
import type { DocumentHead } from "@/app/ports/shared/documents/documents";
import type { TenantId, EnvelopeId, Page, PageOpts } from "@/app/ports/shared";
import type { AllowedContentType } from "@/domain/values/enums";

/** Upstream row shape (lenient across repos). */
type RepoRow = {
  id?: string;
  documentId?: string;
  docId?: string;

  name?: string;
  title?: string;

  contentType?: AllowedContentType | string;
  createdAt?: string | Date | number;
};

type RepoListInput  = { tenantId: TenantId; envelopeId: EnvelopeId } & PageOpts;
type RepoListOutput = Page<RepoRow>;

/** Narrow view we care about from any repo instance. */
type WithListByEnvelope = {
  listByEnvelope?: (input: RepoListInput) => Promise<RepoListOutput>;
};

export const makeDocumentsQueriesPort = (repo: unknown): DocumentsQueriesPort => ({
  async listByEnvelope(input) {
    const r = repo as WithListByEnvelope;

    if (typeof r.listByEnvelope !== "function") {
      return { items: [], nextCursor: undefined };
    }

    const page = await r.listByEnvelope(input);

    const items: DocumentHead[] = (page.items ?? []).map((row) => ({
      id: row.id ?? row.documentId ?? row.docId ?? "",
      name: row.name ?? row.title ?? "",
      contentType: (row.contentType ?? "") as string,
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : typeof row.createdAt === "number"
              ? new Date(row.createdAt).toISOString()
              : "",
    }));

    return { items, nextCursor: page.nextCursor };
  },
});
