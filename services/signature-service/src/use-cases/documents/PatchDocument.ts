/**
 * @file PatchDocument.ts
 * @summary Updates document metadata with partial data.
 */

import {
  z,
  TrimmedString,
  nowIso,
  type ISODateString,
} from "@lawprotect/shared-ts";
import type { Repository } from "@lawprotect/shared-ts";

import type { Document } from "@/domain/entities/Document";
import type { Envelope } from "@/domain/entities/Envelope";
import type { DocumentId } from "@/domain/value-objects";
import { assertDocumentMutable, assertEnvelopeDraftForDocumentModification } from "@/domain/rules/Documents.rules";

export interface PatchDocumentInput {
  documentId: DocumentId;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface PatchDocumentOutput {
  document: Document;
}

export interface PatchDocumentContext {
  repos: {
    documents: Repository<Document, DocumentId>;
    envelopes: Repository<Envelope, string>;
  };
}

export const patchDocument = async (
  input: PatchDocumentInput,
  ctx: PatchDocumentContext
): Promise<PatchDocumentOutput> => {
  const document = await ctx.repos.documents.getById(input.documentId);
  if (!document) {
    throw new Error("Document not found");
  }

  // Ensure document is in a mutable state
  assertDocumentMutable(document);

  // Check envelope is in draft state
  const envelope = await ctx.repos.envelopes.getById(document.envelopeId);
  if (!envelope) {
    throw new Error("Envelope not found");
  }
  assertEnvelopeDraftForDocumentModification(envelope);

  const updatedAt = nowIso() as ISODateString;

  // Validate and prepare updates
  const updates: Partial<Document> = {
    updatedAt,
  };

  if (input.name !== undefined) {
    updates.name = TrimmedString.pipe(z.string().min(1).max(255)).parse(input.name);
  }

  if (input.metadata !== undefined) {
    updates.metadata = input.metadata;
  }

  const updatedDocument = await ctx.repos.documents.update(input.documentId, updates);

  return { document: updatedDocument };
};
