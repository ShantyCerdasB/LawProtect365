/**
 * @file Document.ts
 * @summary Document aggregate for the signature domain.
 *
 * @description
 * Represents a document within an envelope that can be signed.
 * Contains document metadata, storage information, and lifecycle state.
 * This aggregate is intentionally minimal and serializable.
 */

import type { DocumentId, EnvelopeId, TenantId } from "@/domain/value-objects/ids";
import type { DocumentStatus } from "@/domain/value-objects/index";
import type { S3ObjectRef } from "@/domain/value-objects/index";
import type { ContentType } from "@/domain/value-objects/index";

/**
 * Document aggregate.
 */
export interface Document {
  /** Canonical identifier of the document (ULID/UUID brand). */
  documentId: DocumentId;

  /** Envelope this document belongs to. */
  envelopeId: EnvelopeId;

  /** Tenant owning the resource (multitenancy boundary). */
  tenantId: TenantId;

  /** Human-friendly name of the document. */
  name: string;

  /** Current lifecycle status of the document. */
  status: DocumentStatus;

  /** MIME type of the document. */
  contentType: ContentType;

  /** Size of the document in bytes. */
  size: number;

  /** SHA-256 hash digest of the document content. */
  digest: string;

  /** S3 storage reference. */
  s3Ref: S3ObjectRef;

  /** Number of pages in the document (for PDFs). */
  pageCount?: number;

  /** ISO-8601 creation timestamp. */
  createdAt: string;

  /** ISO-8601 last update timestamp. */
  updatedAt: string;

  /** Optional metadata for extensibility. */
  metadata?: Record<string, unknown>;
}






