/**
 * @file SigningS3Service.ts
 * @summary S3 service for Signing operations
 * @description Handles S3 operations for signing (upload/download) using S3Presigner
 */

import type { S3Presigner } from "@lawprotect/shared-ts";
import type { EnvelopeId } from "../../../domain/value-objects/Ids";
import type { SigningS3Service } from "../../../shared/types/signing";
import { ulid } from "@lawprotect/shared-ts";

/**
 * @description Default implementation of SigningS3Service
 */
export class DefaultSigningS3Service implements SigningS3Service {
  constructor(
    private readonly s3Presigner: S3Presigner,
    private readonly uploadBucket: string,
    private readonly downloadBucket: string,
    private readonly uploadTtlSeconds: number = 900, // 15 minutes
    private readonly downloadTtlSeconds: number = 900 // 15 minutes
  ) {}

  /**
   * @summary Creates a presigned upload URL
   * @description Creates a presigned URL for uploading files to S3
   * @param envelopeId - Envelope identifier
   * @param filename - Filename to upload
   * @param contentType - Content type of the file
   * @returns Promise resolving to upload URL details
   */
  async createPresignedUploadUrl(
    envelopeId: EnvelopeId,
    filename: string,
    contentType: string
  ): Promise<{
    uploadUrl: string;
    objectKey: string;
    expiresAt: string;
  }> {
    const objectKey = `envelopes/${envelopeId}/uploads/${ulid()}/${filename}`;
    const expiresAt = new Date(Date.now() + this.uploadTtlSeconds * 1000).toISOString();

    const uploadUrl = await this.s3Presigner.putObjectUrl({
      bucket: this.uploadBucket,
      key: objectKey,
      contentType,
      expiresInSeconds: this.uploadTtlSeconds,
      acl: "private",
      cacheControl: "max-age=3600",
    });

    return {
      uploadUrl,
      objectKey,
      expiresAt,
    };
  }

  /**
   * @summary Creates a presigned download URL
   * @description Creates a presigned URL for downloading signed documents from S3
   * @param envelopeId - Envelope identifier
   * @returns Promise resolving to download URL details
   */
  async createPresignedDownloadUrl(
    envelopeId: EnvelopeId
  ): Promise<{
    downloadUrl: string;
    objectKey: string;
    expiresAt: string;
  }> {
    // Use the standard signed document key pattern
    const objectKey = `envelopes/${envelopeId}/signed/document.pdf`;
    const expiresAt = new Date(Date.now() + this.downloadTtlSeconds * 1000).toISOString();

    const downloadUrl = await this.s3Presigner.getObjectUrl({
      bucket: this.downloadBucket,
      key: objectKey,
      expiresInSeconds: this.downloadTtlSeconds,
      responseContentType: "application/pdf",
      responseContentDisposition: `attachment; filename="signed-document-${envelopeId}.pdf"`,
    });

    return {
      downloadUrl,
      objectKey,
      expiresAt,
    };
  }
}
