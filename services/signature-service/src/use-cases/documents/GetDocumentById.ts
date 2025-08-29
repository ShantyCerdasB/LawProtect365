/**
 * @file GetDocumentById.ts
 * @summary Retrieves a single document by id.
 */

import type { Document } from "@/domain/entities/Document";
import type { DocumentId } from "@/domain/value-objects";
import type { Repository } from "@lawprotect/shared-ts";
import { documentNotFound } from "@/errors";

export interface GetDocumentByIdInput {
  documentId: DocumentId;
}

export interface GetDocumentByIdOutput {
  document: Document;
}

export interface GetDocumentByIdContext {
  repos: {
    documents: Repository<Document, DocumentId>;
  };
}

export const getDocumentById = async (
  input: GetDocumentByIdInput,
  ctx: GetDocumentByIdContext
): Promise<GetDocumentByIdOutput> => {
  const doc = await ctx.repos.documents.getById(input.documentId);
  if (!doc) throw documentNotFound({ documentId: input.documentId });
  return { document: doc };
};
