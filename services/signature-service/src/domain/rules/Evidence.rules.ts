import { AppError } from "@lawprotect/shared-ts";
import { ErrorCodes } from "@lawprotect/shared-ts";
import { ContentTypeSchema } from "../value-objects/ContentType";

/**
 * Validates S3 routing policy based on tenant/envelope/document.
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
  const ct = ContentTypeSchema.parse(contentType);
  if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(ct)) {
    throw new AppError(ErrorCodes.COMMON_UNSUPPORTED_MEDIA_TYPE, 415, "Unsupported content-type for evidence");
  }
  if (size > maxSize) {
    throw new AppError(ErrorCodes.COMMON_PAYLOAD_TOO_LARGE, 413, "File exceeds allowed size");
  }
};
