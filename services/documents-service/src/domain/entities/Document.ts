/**
 * @file Document.ts
 * @summary Document aggregate for the signature domain.
 *
 * @description
 * Represents a document within an envelope that can be signed.
 * Contains document metadata, storage information, and lifecycle state.
 * This aggregate is intentionally minimal and serializable.
 */

import type { DocumentId, EnvelopeId } from "@/domain/value-objects/ids";
import type { DocumentStatus, S3ObjectRef, ContentType } from "@/domain/value-objects/index";

/**
 * Document aggregate.
 */
export interface Document {
  /** Canonical identifier of the document (ULID/UUID brand). */
  readonly documentId: DocumentId;

  /** Envelope this document belongs to. */
  readonly envelopeId: EnvelopeId;

  /** Human-friendly name of the document. */
  readonly name: string;

  /** Current lifecycle status of the document. */
  readonly status: DocumentStatus;

  /** MIME type of the document. */
  readonly contentType: ContentType;

  /** Size of the document in bytes. */
  readonly size: number;

  /** SHA-256 hash digest of the document content. */
  readonly digest: string;

  /** S3 storage reference. */
  readonly s3Ref: S3ObjectRef;

  /** Number of pages in the document (for PDFs). */
  readonly pageCount?: number;

  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;

  /** ISO-8601 last update timestamp. */
  readonly updatedAt: string;

  /** Optional metadata for extensibility. */
  readonly metadata?: Record<string, unknown>;
}

