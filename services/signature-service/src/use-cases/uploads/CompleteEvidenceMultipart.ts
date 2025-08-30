/**
 * @file CompleteEvidenceMultipart.ts
 * @summary Use case for completing multipart evidence uploads
 * @description Finalizes multipart upload sessions and marks evidence as available
 */

import type { EnvelopeId, TenantId } from "@/domain/value-objects";
import type { EnvelopeRepository } from "@/domain/ports/Envelope";
import type { S3EvidenceStorage } from "@/adapters/s3/S3EvidenceStorage";
import * as Rules from "@/domain/rules";

/**
 * @description Multipart part information
 */
export interface MultipartPart {
  /** Part number */
  partNumber: number;
  /** ETag returned by S3 */
  etag: string;
}

/**
 * @description Input for completing multipart evidence upload
 */
export interface CompleteEvidenceMultipartInput {
  /** Tenant identifier */
  tenantId: TenantId;
  /** Envelope identifier */
  envelopeId: EnvelopeId;
  /** Upload session identifier */
  uploadId: string;
  /** S3 bucket name */
  bucket: string;
  /** S3 object key */
  key: string;
  /** Array of completed parts */
  parts: MultipartPart[];
  /** Optional object reference */
  objectRef?: string;
  /** Actor information */
  actor: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
}

/**
 * @description Output for completing multipart evidence upload
 */
export interface CompleteEvidenceMultipartOutput {
  /** Object reference */
  objectRef: string;
  /** Optional version ID */
  versionId?: string;
}

/**
 * @description Context for completing multipart evidence upload
 */
export interface CompleteEvidenceMultipartContext {
  repos: {
    envelopes: EnvelopeRepository;
  };
  storage: {
    evidence: S3EvidenceStorage;
  };
}

/**
 * @description Completes multipart evidence upload for an envelope
 * @param input - Input parameters
 * @param ctx - Use case context
 * @returns Promise resolving to completion result
 */
export const completeEvidenceMultipart = async (
  input: CompleteEvidenceMultipartInput,
  ctx: CompleteEvidenceMultipartContext
): Promise<CompleteEvidenceMultipartOutput> => {
  // Validate envelope exists and belongs to tenant
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw new Error(`Envelope not found: ${input.envelopeId}`);
  }

  // Validate envelope belongs to tenant
  Rules.Multitenancy.assertBelongsToTenant(envelope.tenantId, input.tenantId);

  // Validate envelope status allows evidence uploads
  Rules.Upload.assertEnvelopeAllowsEvidence(envelope.status);

  // Validate parts array
  if (!input.parts || input.parts.length === 0) {
    throw new Error("At least one part is required");
  }

  // Validate part numbers are sequential and start from 1
  const sortedParts = input.parts.sort((a, b) => a.partNumber - b.partNumber);
  for (let i = 0; i < sortedParts.length; i++) {
    if (sortedParts[i].partNumber !== i + 1) {
      throw new Error(`Part numbers must be sequential starting from 1, got: ${sortedParts[i].partNumber}`);
    }
  }

  // Complete multipart upload
  const result = await ctx.storage.evidence.completeMultipartUpload({
    bucket: input.bucket,
    key: input.key,
    uploadId: input.uploadId,
    parts: input.parts,
  });

  // Generate object reference if not provided
  const objectRef = input.objectRef || `${input.key}#${input.uploadId}`;

  return {
    objectRef,
    versionId: result.versionId,
  };
};

