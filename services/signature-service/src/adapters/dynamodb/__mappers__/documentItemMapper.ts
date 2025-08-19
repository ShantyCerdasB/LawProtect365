import { Document } from "../../../domain/entities/Document";
import { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError } from "@lawprotect/shared-ts";
import { ErrorCodes } from "@lawprotect/shared-ts";

/**
 * @file DocumentItemMapper.ts
 *
 * Provides bidirectional mapping logic between the domain-level `Document` entity
 * and its DynamoDB persistence representation (`DocumentItem`).
 *
 * - Ensures type safety using a type guard.
 * - Throws a shared `BadRequestError` if validation fails.
 */

/**
 * DynamoDB representation of a Document.
 */
export interface DocumentItem {
  /** Partition key → Envelope grouping */
  pk: string;
  /** Sort key → Document grouping */
  sk: string;
  /** Unique document identifier */
  documentId: string;
  /** Parent envelope identifier */
  envelopeId: string;
  /** Human-readable file name */
  name: string;
  /** MIME type of the file */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** S3 bucket name */
  bucket: string;
  /** S3 object key */
  key: string;
  /** Current document status (e.g., UPLOADED, SIGNED, DELETED) */
  status: string;
  /** ISO string when the document was created */
  createdAt: string;
  /** ISO string when the document was last updated */
  updatedAt: string;
}

/**
 * Type guard for DocumentItem.
 *
 * @param value - Arbitrary object to validate.
 * @returns True if value is a DocumentItem.
 */
export function isDocumentItem(value: unknown): value is DocumentItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "documentId" in value &&
    "envelopeId" in value &&
    "name" in value &&
    "bucket" in value &&
    "key" in value
  );
}

/**
 * Mapper implementation for Document ↔ DocumentItem.
 */
export const documentItemMapper: Mapper<Document, DocumentItem> = {
  /**
   * Maps a domain `Document` entity into a DynamoDB `DocumentItem`.
   *
   * @param entity - Domain `Document` entity.
   * @returns DynamoDB-compatible `DocumentItem`.
   */
  toDTO(entity: Document): DocumentItem {
    return {
      pk: `ENVELOPE#${entity.envelopeId}`,
      sk: `DOCUMENT#${entity.documentId}`,
      documentId: entity.documentId,
      envelopeId: entity.envelopeId,
      name: entity.name,
      mimeType: entity.mimeType,
      size: entity.size,
      bucket: entity.bucket,
      key: entity.key,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  },

  /**
   * Maps a DynamoDB `DocumentItem` into a domain `Document`.
   *
   * @param persisted - DynamoDB `DocumentItem`.
   * @returns Domain `Document` entity.
   * @throws BadRequestError if validation fails.
   */
  fromDTO(persisted: DocumentItem): Document {
    if (!isDocumentItem(persisted)) {
      throw new BadRequestError(
        "Invalid persistence object for Document",
        ErrorCodes.COMMON_BAD_REQUEST,
        { received: persisted }
      );
    }
    return new Document({
      documentId: persisted.documentId,
      envelopeId: persisted.envelopeId,
      name: persisted.name,
      mimeType: persisted.mimeType,
      size: persisted.size,
      bucket: persisted.bucket,
      key: persisted.key,
      status: persisted.status,
      createdAt: persisted.createdAt,
      updatedAt: persisted.updatedAt,
    });
  },
};
