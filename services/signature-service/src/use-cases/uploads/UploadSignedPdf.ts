/**
 * @file UploadSignedPdf.ts
 * @summary Use case for uploading signed PDFs
 * @description Handles the upload of final signed PDFs to the repository
 */

import type { EnvelopeId, TenantId } from "@/domain/value-objects";
import type { EnvelopeRepository } from "@/domain/ports/Envelope";
import type { S3SignedPdfIngestor } from "@/adapters/s3/S3SignedPdfIngestor";
import * as Rules from "@/domain/rules";

/**
 * @description Input for uploading signed PDF
 */
export interface UploadSignedPdfInput {
  /** Tenant identifier */
  tenantId: TenantId;
  /** Envelope identifier */
  envelopeId: EnvelopeId;
  /** Content length in bytes */
  contentLength: number;
  /** Optional SHA256 hash */
  sha256?: string;
  /** Actor information */
  actor: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
}

/**
 * @description Output for uploading signed PDF
 */
export interface UploadSignedPdfOutput {
  /** Object reference */
  objectRef: string;
  /** Optional version ID */
  versionId?: string;
}

/**
 * @description Context for uploading signed PDF
 */
export interface UploadSignedPdfContext {
  repos: {
    envelopes: EnvelopeRepository;
  };
  storage: {
    pdfIngestor: S3SignedPdfIngestor;
  };
}

/**
 * @description Uploads signed PDF for an envelope
 * @param input - Input parameters
 * @param ctx - Use case context
 * @returns Promise resolving to upload result
 */
export const uploadSignedPdf = async (
  input: UploadSignedPdfInput,
  ctx: UploadSignedPdfContext
): Promise<UploadSignedPdfOutput> => {
  // Validate envelope exists and belongs to tenant
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw new Error(`Envelope not found: ${input.envelopeId}`);
  }

  // Validate envelope belongs to tenant
  Rules.Multitenancy.assertBelongsToTenant(envelope.tenantId, input.tenantId);

  // Validate envelope status allows PDF uploads
  Rules.Upload.assertEnvelopeAllowsPdfUpload(envelope.status);

  // Validate file size
  Rules.Upload.assertFileSize(input.contentLength, "pdf");

  // Generate unique object key
  const objectKey = `signed-pdfs/${input.envelopeId}/${Date.now()}.pdf`;

  // Upload PDF to S3
  const result = await ctx.storage.pdfIngestor.uploadSignedPdf({
    bucket: process.env.SIGNED_PDF_BUCKET || "signed-pdfs-bucket",
    key: objectKey,
    contentLength: input.contentLength,
    metadata: {
      envelopeId: input.envelopeId,
      uploadedBy: input.actor.userId || input.actor.email,
      sha256: input.sha256,
      uploadedAt: new Date().toISOString(),
    },
  });

  return {
    objectRef: `${objectKey}#${result.versionId || "latest"}`,
    versionId: result.versionId,
  };
};

