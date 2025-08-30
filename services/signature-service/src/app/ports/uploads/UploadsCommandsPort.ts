/**
 * @file UploadsCommandsPort.ts
 * @summary Port interface for upload command operations
 * @description Defines the contract for upload operations including evidence and PDF uploads
 */

import type { EnvelopeId, TenantId } from "@/domain/value-objects";
import type { PresignEvidenceResult, CompleteEvidenceResult, UploadSignedPdfResult } from "@/domain/value-objects/Upload";

/**
 * @description Input for presigning evidence upload
 */
export interface PresignEvidenceCommand {
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
 * @description Input for completing multipart evidence upload
 */
export interface CompleteEvidenceCommand {
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
  parts: Array<{
    /** Part number */
    partNumber: number;
    /** ETag returned by S3 */
    etag: string;
  }>;
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
 * @description Input for uploading signed PDF
 */
export interface UploadSignedPdfCommand {
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
 * @description Port interface for upload command operations
 */
export interface UploadsCommandsPort {
  /**
   * @description Presign evidence upload for an envelope
   * @param command - Presign evidence command
   * @returns Promise resolving to presigned upload session
   */
  presignEvidence(command: PresignEvidenceCommand): Promise<PresignEvidenceResult>;

  /**
   * @description Complete multipart evidence upload for an envelope
   * @param command - Complete evidence command
   * @returns Promise resolving to completion result
   */
  completeEvidence(command: CompleteEvidenceCommand): Promise<CompleteEvidenceResult>;

  /**
   * @description Upload signed PDF for an envelope
   * @param command - Upload signed PDF command
   * @returns Promise resolving to upload result
   */
  uploadSignedPdf(command: UploadSignedPdfCommand): Promise<UploadSignedPdfResult>;
}
