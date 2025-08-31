/**
 * @file documentItemMapper.ts
 * @summary Bidirectional mapper for Document ⇄ DynamoDB item
 * @description Maps between domain Document entities and DynamoDB persistence format.
 * Uses envelope-scoped partitioning with document-specific sort keys for single-table design.
 */

import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

import type { Document } from "../../../domain/entities/Document";
import type { DocumentId, EnvelopeId, TenantId } from "../../../domain/value-objects/Ids";
import type { AllowedContentType } from "../../../domain/values/enums";

/**
 * @summary DynamoDB persistence shape for Document entities
 * @description DynamoDB representation of a Document using single-table design pattern.
 * Uses envelope-scoped partitioning: pk = ENVELOPE#<envelopeId>, sk = DOCUMENT#<documentId>
 */
export interface DocumentItem {
  /** Partition key for envelope scope */
  readonly pk: string;
  /** Sort key for document identification */
  readonly sk: string;

  /** Document identifier */
  readonly documentId: string;
  /** Associated envelope identifier */
  readonly envelopeId: string;
  /** Tenant identifier for multi-tenancy */
  readonly tenantId: string;

  /** Document display name */
  readonly name: string;
  /** Current document status */
  readonly status: string;
  /** MIME content type */
  readonly contentType: string;

  /** File size in bytes */
  readonly size: number;
  /** Content hash for integrity */
  readonly digest: string;

  /** S3 bucket name */
  readonly s3Bucket: string;
  /** S3 object key */
  readonly s3Key: string;

  /** Number of pages (optional) */
  readonly pageCount?: number;

  /** Creation timestamp */
  readonly createdAt: string;
  /** Last update timestamp */
  readonly updatedAt: string;

  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * @summary Runtime type guard for DocumentItem validation
 * @description Validates that a raw object conforms to the DocumentItem interface structure.
 * Ensures all required fields are present with correct types before mapping.
 * @param v - Arbitrary value to validate
 * @returns True if the value is a valid DocumentItem
 */
export function isDocumentItem(v: unknown): v is DocumentItem {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.pk === "string" &&
    typeof o.sk === "string" &&
    typeof o.documentId === "string" &&
    typeof o.envelopeId === "string" &&
    typeof o.tenantId === "string" &&
    typeof o.name === "string" &&
    typeof o.status === "string" &&
    typeof o.contentType === "string" &&
    typeof o.size === "number" &&
    typeof o.digest === "string" &&
    typeof o.s3Bucket === "string" &&
    typeof o.s3Key === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.updatedAt === "string"
  );
}

/**
 * @summary Bidirectional mapper for Document domain entities
 * @description Converts between domain Document entities and DynamoDB persistence format.
 * Handles branded type casting and ensures data integrity through validation.
 */
export const documentItemMapper: Mapper<Document, DocumentItem> = {
  /**
   * @summary Maps domain Document to DynamoDB DocumentItem
   * @description Converts a domain Document entity to its DynamoDB persistence representation.
   * Handles branded type casting and constructs envelope-scoped partition keys.
   * @param entity - Domain Document entity
   * @returns DynamoDB DocumentItem for persistence
   */
  toDTO(entity: Document): DocumentItem {
    return {
      pk: `ENVELOPE#${entity.envelopeId}`,
      sk: `DOCUMENT#${entity.documentId}`,

      documentId: entity.documentId,
      envelopeId: entity.envelopeId,
      tenantId: entity.tenantId,

      name: entity.name,
      status: entity.status,
      contentType: entity.contentType,

      size: entity.size,
      digest: entity.digest,

      s3Bucket: entity.s3Ref.bucket,
      s3Key: entity.s3Ref.key,

      pageCount: entity.pageCount,

      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,

      metadata: entity.metadata,
    };
  },

  /**
   * @summary Maps DynamoDB DocumentItem to domain Document
   * @description Converts a DynamoDB DocumentItem back to its domain entity representation.
   * Validates the persistence object and handles branded type casting.
   * @param persisted - DynamoDB DocumentItem from persistence
   * @returns Domain Document entity
   * @throws BadRequestError when persistence object is invalid
   */
  fromDTO(persisted: DocumentItem): Document {
    if (!isDocumentItem(persisted)) {
      throw new BadRequestError(
        "Invalid persistence object for Document",
        ErrorCodes.COMMON_BAD_REQUEST,
        { item: persisted }
      );
    }

    return {
      documentId: persisted.documentId as DocumentId,
      envelopeId: persisted.envelopeId as EnvelopeId,
      tenantId: persisted.tenantId as TenantId,

      name: persisted.name,
      status: persisted.status as Document["status"],
      contentType: persisted.contentType as AllowedContentType,

      size: persisted.size,
      digest: persisted.digest,

      s3Ref: {
        bucket: persisted.s3Bucket,
        key: persisted.s3Key,
      },

      pageCount: persisted.pageCount,

      createdAt: persisted.createdAt,
      updatedAt: persisted.updatedAt,

      metadata: persisted.metadata,
    };
  },
};
