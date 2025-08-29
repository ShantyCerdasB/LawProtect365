/**
 * @file DeleteDocument.ts
 * @summary Deletes a document from an envelope.
 */

import type { Repository } from "@lawprotect/shared-ts";

import type { Document } from "@/domain/entities/Document";
import type { Envelope } from "@/domain/entities/Envelope";
import type { DocumentId } from "@/domain/value-objects";
import { assertEnvelopeDraftForDocumentModification } from "@/domain/rules/Documents.rules";

export interface DeleteDocumentInput {
  documentId: DocumentId;
}

export interface DeleteDocumentOutput {
  deleted: boolean;
}

export interface DeleteDocumentContext {
  repos: {
    documents: Repository<Document, DocumentId>;
    envelopes: Repository<Envelope, string>;
  };
}

export const deleteDocument = async (
  input: DeleteDocumentInput,
  ctx: DeleteDocumentContext
): Promise<DeleteDocumentOutput> => {
  const document = await ctx.repos.documents.getById(input.documentId);
  if (!document) {
    throw new Error("Document not found");
  }

  // Check envelope is in draft state
  const envelope = await ctx.repos.envelopes.getById(document.envelopeId);
  if (!envelope) {
    throw new Error("Envelope not found");
  }
  assertEnvelopeDraftForDocumentModification(envelope);

  await ctx.repos.documents.delete(input.documentId);

  return { deleted: true };
};
