/**
 * @file Evidence.rules.ts
 * @summary Domain rules for evidence validation and S3 path generation
 * @description Validates evidence content types, file sizes, and generates
 * S3 paths for evidence storage with proper tenant/envelope organization.
 */

import { AppError, ErrorCodes } from "@lawprotect/shared-ts";
import { ContentTypeSchema } from "@/domain/value-objects/index";
import { ALLOWED_CONTENT_TYPES, type AllowedContentType } from "../values/enums";

/**
 * @summary Generates S3 path for evidence storage
 * @description Creates a structured S3 path for evidence files based on
 * tenant, envelope, and optional document hierarchy.
 * 
 * @param p - Path parameters
 * @param p.tenantId - Tenant identifier
 * @param p.envelopeId - Envelope identifier  
 * @param p.documentId - Optional document identifier
 * @param p.file - File name
 * @returns Structured S3 path string
 */
export const buildEvidencePath = (p: { tenantId: string; envelopeId: string; documentId?: string; file: string }): string =>
  [
    "tenants", p.tenantId,
    "envelopes", p.envelopeId,
    p.documentId ? ["documents", p.documentId] : [],
    "evidence", p.file
  ]
    .flat()
    .join("/");

/**
 * Validates presign policy for content type and file size.
 */
export const assertPresignPolicy = (contentType: string, size: number, maxSize: number): void => {
  const ct = ContentTypeSchema.parse(contentType) as AllowedContentType; 
  if (!ALLOWED_CONTENT_TYPES.includes(ct)) {
    throw new AppError(ErrorCodes.COMMON_UNSUPPORTED_MEDIA_TYPE, 415, "Unsupported content-type for evidence");
  }
  if (size > maxSize) {
    throw new AppError(ErrorCodes.COMMON_PAYLOAD_TOO_LARGE, 413, "File exceeds allowed size");
  }
};


