/**
 * @file PresignEvidence.ts
 * @summary Use case for presigning evidence uploads
 * @description Creates multipart upload sessions for evidence files with presigned URLs
 */

import type { EnvelopeId, TenantId } from "@/domain/value-objects";
import type { EnvelopeRepository } from "@/domain/ports/Envelope";
import type { S3EvidenceStorage } from "@/adapters/s3/S3EvidenceStorage";
import * as Rules from "@/domain/rules";
import { FILE_SIZE_LIMITS } from "@/domain/values/enums";
import { ulid } from "@lawprotect/shared-ts";

/**
 * @description Input for presigning evidence upload
 */
export interface PresignEvidenceInput {
  /** Tenant identifier */
  tenantId: TenantId;
  /** Envelope identifier */
  envelopeId: EnvelopeId;
  /** Content type of the file */
  contentType: string;
  /** Estimated file size in bytes */
  sizeBytes: number;
  /** Optional number of parts for multipart upload */
  parts?: number;
  /** Optional SHA256 hash for integrity */
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
 * @description Output for presigning evidence upload
 */
export interface PresignEvidenceOutput {
  /** Upload session identifier */
  uploadId: string;
  /** S3 bucket name */
  bucket: string;
  /** S3 object key */
  key: string;
  /** Size of each part in bytes */
  partSize: number;
  /** Array of presigned URLs for each part */
  urls: Array<{
    /** Part number */
    partNumber: number;
    /** Presigned URL for this part */
    url: string;
  }>;
  /** Object reference for tracking */
  objectRef: string;
}

/**
 * @description Context for presigning evidence upload
 */
export interface PresignEvidenceContext {
  repos: {
    envelopes: EnvelopeRepository;
  };
  storage: {
    evidence: S3EvidenceStorage;
  };
  ids: {
    ulid(): string;
  };
}

/**
 * @description Presigns evidence upload for an envelope
 * @param input - Input parameters
 * @param ctx - Use case context
 * @returns Promise resolving to presigned upload session
 */
export const presignEvidence = async (
  input: PresignEvidenceInput,
  ctx: PresignEvidenceContext
): Promise<PresignEvidenceOutput> => {
  // Validate envelope exists and belongs to tenant
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw new Error(`Envelope not found: ${input.envelopeId}`);
  }

  // Validate envelope belongs to tenant
  Rules.Multitenancy.assertBelongsToTenant(envelope.tenantId, input.tenantId);

  // Validate envelope status allows evidence uploads
  Rules.Upload.assertEnvelopeAllowsEvidence(envelope.status);

  // Validate file size
  Rules.Upload.assertFileSize(input.sizeBytes, "evidence");

  // Validate content type
  Rules.Upload.assertContentType(input.contentType, "evidence");

  // Calculate optimal part size and number of parts
  const optimalPartSize = Math.min(
    FILE_SIZE_LIMITS.MULTIPART_PART,
    Math.ceil(input.sizeBytes / (input.parts || 10))
  );

  const numParts = Math.ceil(input.sizeBytes / optimalPartSize);
  Rules.Upload.assertPartCount(numParts);

  // Generate unique object key
  const objectKey = `evidence/${input.envelopeId}/${ctx.ids.ulid()}`;
  const uploadId = ctx.ids.ulid();

  // Create multipart upload session
  const multipartUpload = await ctx.storage.evidence.createMultipartUpload({
    bucket: process.env.EVIDENCE_BUCKET || "evidence-bucket",
    key: objectKey,
    contentType: input.contentType,
    metadata: {
      envelopeId: input.envelopeId,
      uploadId,
      sha256: input.sha256,
      uploadedBy: input.actor.userId || input.actor.email,
    },
  });

  // Generate presigned URLs for each part
  const urls = [];
  for (let i = 1; i <= numParts; i++) {
    const url = await ctx.storage.evidence.getPresignedUrl({
      bucket: process.env.EVIDENCE_BUCKET || "evidence-bucket",
      key: objectKey,
      partNumber: i,
      uploadId: multipartUpload.uploadId,
      expiresIn: 3600, // 1 hour
    });

    urls.push({
      partNumber: i,
      url,
    });
  }

  return {
    uploadId: multipartUpload.uploadId,
    bucket: process.env.EVIDENCE_BUCKET || "evidence-bucket",
    key: objectKey,
    partSize: optimalPartSize,
    urls,
    objectRef: `${objectKey}#${uploadId}`,
  };
};
