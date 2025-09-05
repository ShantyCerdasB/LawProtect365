/**
 * Adapter: DocumentRepository → DocumentsQueriesPort.
 * - Uses repo.listByEnvelope if available; otherwise returns an empty page.
 * - Normalizes repository rows into DocumentHead.
 * - Keeps cursor opaque (passes through nextCursor).
 */
import type { DocumentsQueriesPort, ListDocumentsQuery, ListDocumentsResult } from "./DocumentsQueriesPort";
import type { DocumentHead } from "@/app/ports/shared/documents/documents";
import type { TenantId, EnvelopeId, Page, PageOpts, DocumentId } from "@/app/ports/shared";
import type { DocumentLock } from "@/domain/value-objects/DocumentLock";
import type { Document } from "@/domain/entities/Document";

/** Upstream row shape (lenient across repos). */
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

/** Narrow view we care about from any repo instance. */
type WithListByEnvelope = {
  listByEnvelope?: (input: RepoListInput) => Promise<RepoListOutput>;
  getById?: (id: DocumentId) => Promise<Document | null>;
};

export const makeDocumentsQueriesPort = (repo: unknown): DocumentsQueriesPort => ({
  async getById(documentId: DocumentId): Promise<any> {
    const r = repo as WithListByEnvelope;
    
    if (typeof r.getById !== "function") {
      return null;
    }

    return await r.getById(documentId);
  },

  async listByEnvelope(query: ListDocumentsQuery): Promise<ListDocumentsResult> {
    const r = repo as WithListByEnvelope;

    if (typeof r.listByEnvelope !== "function") {
      return { items: [], nextCursor: undefined };
    }

    // Convert ListDocumentsQuery to RepoListInput
    // Note: ListDocumentsQuery doesn't have tenantId, so we need to handle this differently
    // For now, we'll use a default tenantId or modify the approach
    const repoInput: RepoListInput = {
      tenantId: "" as TenantId, // This needs to be provided by the caller
      envelopeId: query.envelopeId,
      limit: query.limit,
      cursor: query.cursor,
    };

    const page = await r.listByEnvelope(repoInput);

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

  async listLocks(documentId: DocumentId): Promise<DocumentLock[]> {
    const r = repo as WithListByEnvelope;
    
    if (typeof r.getById !== "function") {
      return [];
    }

    const document = await r.getById(documentId);
    if (!document) {
      return [];
    }

    const locks = document.metadata?.locks;
    return Array.isArray(locks) ? locks : [];
  },
});
