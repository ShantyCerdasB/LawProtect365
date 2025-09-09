/**
 * @file DocumentDdbTypes.ts
 * @summary DynamoDB types and utilities for Document entities
 * @description Defines DynamoDB-specific types, constants, and utilities for Document entities
 */

import { DocumentId, EnvelopeId, TenantId } from "@/domain/value-objects";
import type { Document } from "../../../domain/entities/Document";
import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

/**
 * DynamoDB entity type for Document items
 */
export const DOCUMENT_ENTITY = "Document" as const;

/**
 * Partition key builder for Document items
 * @param envelopeId - The envelope identifier
 * @returns DynamoDB partition key
 */
export const documentPk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;

/**
 * Sort key builder for Document items
 * @param documentId - The document identifier
 * @returns DynamoDB sort key
 */
export const documentSk = (documentId: string): string => `DOCUMENT#${documentId}`;

/**
 * Persisted DynamoDB item shape for Document entities
 * This is the exact structure stored in the table
 */
export type DdbDocumentItem = {
  pk: string;
  sk: string;
  type: typeof DOCUMENT_ENTITY;

  documentId: DocumentId;
  envelopeId: EnvelopeId;
  tenantId: TenantId;

  name: string;
  status: Document["status"];
  contentType: Document["contentType"];

  size: number;
  digest: string;

  s3Bucket: string;
  s3Key: string;

  pageCount?: number;

  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  metadata?: Record<string, unknown>;

  // GSI fields for efficient document lookup
  gsi1pk?: string; // documentId for GSI1
  gsi1sk?: string; // createdAt for sorting
};

/**
 * Type guard to check if an object is a valid DdbDocumentItem
 * @param v - Object to validate
 * @returns True if the object is a valid DdbDocumentItem
 */
export const isDdbDocumentItem = (v: unknown): v is DdbDocumentItem => {
  const o = v as Partial<DdbDocumentItem> | null | undefined;

  return Boolean(
    o &&
      typeof o.pk === "string" &&
      typeof o.sk === "string" &&
      o.type === DOCUMENT_ENTITY &&
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
};

/**
 * Maps domain Document entity to DynamoDB item
 * @param src - Domain Document entity
 * @returns DynamoDB item
 */
export const toDocumentItem = (src: Document): DdbDocumentItem => ({
  pk: documentPk(src.envelopeId),
  sk: documentSk(src.documentId),
  type: DOCUMENT_ENTITY,

  documentId: src.documentId as DocumentId,
  envelopeId: src.envelopeId as EnvelopeId,
  tenantId: src.tenantId as TenantId,

  name: src.name,
  status: src.status,
  contentType: src.contentType,

  size: src.size,
  digest: src.digest,

  s3Bucket: src.s3Ref.bucket,
  s3Key: src.s3Ref.key,

  pageCount: src.pageCount,

  createdAt: src.createdAt,
  updatedAt: src.updatedAt,

  metadata: src.metadata,

  // GSI fields for efficient document lookup
  gsi1pk: `DOCUMENT#${src.documentId}`,
  gsi1sk: src.createdAt,
});

/**
 * Maps DynamoDB item to domain Document entity
 * @param item - DynamoDB item
 * @returns Domain Document entity
 * @throws {BadRequestError} if the provided object is not a valid DdbDocumentItem
 */
export const fromDocumentItem = (item: unknown): Document => {
  if (!isDdbDocumentItem(item)) {
    throw new BadRequestError(
      "Invalid persistence object for Document",
      ErrorCodes.COMMON_BAD_REQUEST,
      { item }
    );
  }

  return Object.freeze<Document>({
    documentId: item.documentId,
    envelopeId: item.envelopeId,
    tenantId: item.tenantId,

    name: item.name,
    status: item.status,
    contentType: item.contentType,

    size: item.size,
    digest: item.digest,

    s3Ref: {
      bucket: item.s3Bucket,
      key: item.s3Key,
    },

    pageCount: item.pageCount,

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,

    metadata: item.metadata,
  });
};

/**
 * Mapper for Document entities (Domain ↔ DynamoDB)
 */
export const documentItemMapper: Mapper<Document, DdbDocumentItem> = {
  toDTO: toDocumentItem,
  fromDTO: fromDocumentItem,
};






