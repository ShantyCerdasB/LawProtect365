/**
 * @file CreateDocument.ts
 * @summary Use case to create a new document within an envelope
 * @description Use case to create a new document within an envelope with proper validation,
 * persistence, and domain event emission for audit tracking.
 */

import {
  z,
  TrimmedString,
  nowIso,
  AppError,
  ErrorCodes,
  type DomainEvent,
  type ISODateString,
} from "@lawprotect/shared-ts";
import type { Repository } from "@lawprotect/shared-ts";

import type { Document } from "@/domain/entities/Document";
import type { Envelope } from "@/domain/entities/Envelope";
import type { DocumentId, EnvelopeId, TenantId } from "@/domain/value-objects/Ids";
import type { S3ObjectRef } from "@/domain/value-objects/S3ObjectRef";
import type { HashDigestString } from "@/domain/value-objects/HashDigest";
import type { FileSize } from "@/domain/value-objects/FileSize";
import type { ContentType } from "@/domain/value-objects/ContentType";
import { assertSupportedContentType, assertDocumentSizeLimit, assertEnvelopeDraftForDocumentModification } from "@/domain/rules/Documents.rules";

/**
 * @description Actor context for audit and attribution purposes.
 */
export interface ActorContext {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  locale?: string;
}

/**
 * @description Input contract for CreateDocument use case.
 */
export interface CreateDocumentInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  name: string;
  contentType: ContentType;
  size: FileSize;
  digest: HashDigestString;
  s3Ref: S3ObjectRef;
  pageCount?: number;
  actor?: ActorContext;
}

/**
 * @description Output contract for CreateDocument use case.
 */
export interface CreateDocumentOutput {
  document: Document;
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for CreateDocument use case.
 */
export interface CreateDocumentContext {
  repos: {
    documents: Repository<Document, DocumentId>;
    envelopes: Repository<Envelope, EnvelopeId>;
  };
  ids: {
    ulid(): string;
  };
}

/**
 * @description Creates a new document within an envelope with status "pending".
 * Validates input, checks envelope state, creates document entity, persists to repository,
 * and emits audit event.
 *
 * @param {CreateDocumentInput} input - Input parameters for document creation
 * @param {CreateDocumentContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<CreateDocumentOutput>} Promise resolving to created document and domain events
 * @throws {AppError} 400 when invariants are violated, 404 when envelope not found
 */
export const createDocument = async (
  input: CreateDocumentInput,
  ctx: CreateDocumentContext
): Promise<CreateDocumentOutput> => {
  // Validate document name
  const name = TrimmedString.pipe(z.string().min(1).max(255)).parse(input.name);

  // Validate content type
  assertSupportedContentType(input.contentType);

  // Validate document size
  assertDocumentSizeLimit(input.size);

  // Check envelope exists and is in draft state
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, "Envelope not found");
  }

  // Ensure envelope is in draft state for document modifications
  assertEnvelopeDraftForDocumentModification(envelope);

  const createdAt = nowIso() as ISODateString;
  const documentId = ctx.ids.ulid() as unknown as DocumentId;

  const document: Document = Object.freeze({
    documentId,
    envelopeId: input.envelopeId,
    tenantId: input.tenantId,
    name,
    status: "pending",
    contentType: input.contentType,
    size: input.size,
    digest: input.digest,
    s3Ref: input.s3Ref,
    pageCount: input.pageCount,
    createdAt,
    updatedAt: createdAt,
  });

  await ctx.repos.documents.create(document);

  const event: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "document.created",
    occurredAt: createdAt,
    payload: {
      documentId,
      envelopeId: input.envelopeId,
      name,
      contentType: input.contentType,
      size: input.size,
      actor: input.actor,
    },
    metadata: undefined,
  };

  return { document, events: [event] as const };
};
