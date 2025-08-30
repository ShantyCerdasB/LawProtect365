import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

import type { Document } from "../../../domain/entities/Document";
import type { DocumentId, EnvelopeId, TenantId } from "../../../domain/value-objects/Ids";
import type { AllowedContentType } from "../../../domain/values/enums";

/**
 * DynamoDB representation of a Document.
 * pk = ENVELOPE#<envelopeId>
 * sk = DOCUMENT#<documentId>
 */
export interface DocumentItem {
  pk: string;
  sk: string;

  documentId: string;
  envelopeId: string;
  tenantId: string;

  name: string;
  status: string;
  contentType: string;

  size: number;
  digest: string;

  s3Bucket: string;
  s3Key: string;

  pageCount?: number;

  createdAt: string;
  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/** Type guard básico para asegurar shape esperado del item. */
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

/** Mapper: Domain ↔ DDB item */
export const documentItemMapper: Mapper<Document, DocumentItem> = {
  /** Domain → DDB */
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

  /** DDB → Domain */
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
