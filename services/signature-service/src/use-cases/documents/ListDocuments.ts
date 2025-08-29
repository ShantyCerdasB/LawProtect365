/**
 * @file ListDocuments.ts
 * @summary Lists documents within an envelope with pagination support.
 */

import type { Document } from "@/domain/entities/Document";
import type { EnvelopeId, DocumentId } from "@/domain/value-objects";
import type { Repository } from "@lawprotect/shared-ts";

export interface ListDocumentsInput {
  envelopeId: EnvelopeId;
  limit?: number;
  cursor?: string;
}

export interface ListDocumentsOutput {
  items: Document[];
  nextCursor?: string;
}

export interface ListDocumentsContext {
  repos: {
    documents: Repository<Document, DocumentId> & {
      listByEnvelope(args: { envelopeId: string; limit: number; cursor?: string }): Promise<{
        items: Document[];
        nextCursor?: string;
      }>;
    };
  };
}

export const listDocuments = async (
  input: ListDocumentsInput,
  ctx: ListDocumentsContext
): Promise<ListDocumentsOutput> => {
  const result = await ctx.repos.documents.listByEnvelope({
    envelopeId: input.envelopeId,
    limit: input.limit || 50,
    cursor: input.cursor,
  });

  return {
    items: result.items,
    nextCursor: result.nextCursor,
  };
};
