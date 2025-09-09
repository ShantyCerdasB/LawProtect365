/**
 * @file DocumentsS3Service.ts
 * @summary S3 service for Documents operations
 * @description Handles S3 operations for Documents including presigned URLs and object management
 */

import type { DocumentId, EnvelopeId, TenantId } from "@/domain/value-objects/ids";
import type { ContentType } from "@/domain/value-objects/index";
import { assertPresignPolicy } from "../../../domain/rules/Evidence.rules";

/**
 * @description Service interface for Documents S3 operations
 */
export interface DocumentsS3Service {
  /**
   * Creates a presigned upload URL for document upload
   * @param bucket - S3 bucket name
   * @param key - S3 object key
   * @param contentType - Document content type
   * @param fileSize - File size in bytes (optional, for validation)
   * @returns Promise resolving to presigned upload URL and expiration
   */
  createPresignedUploadUrl(
    bucket: string,
    key: string,
    contentType: ContentType,
    fileSize?: number
  ): Promise<{ url: string; expiresAt: string }>;

  /**
   * Creates a presigned download URL for document access
   * @param bucket - S3 bucket name
   * @param key - S3 object key
   * @param expiresInSeconds - URL expiration time in seconds (default: 3600)
   * @returns Promise resolving to presigned download URL and expiration
   */
  createPresignedDownloadUrl(
    bucket: string,
    key: string,
    expiresInSeconds?: number
  ): Promise<{ url: string; expiresAt: string }>;

  /**
   * Generates S3 object key for document storage
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param documentId - Document identifier
   * @param fileName - Original file name
   * @returns S3 object key
   */
  generateObjectKey(
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    documentId: DocumentId,
    fileName: string
  ): string;

  /**
   * Validates S3 object key format
   * @param key - S3 object key to validate
   * @returns True if key format is valid
   */
  validateObjectKey(key: string): boolean;
}

/**
 * @description Default implementation of DocumentsS3Service
 */
export class DefaultDocumentsS3Service implements DocumentsS3Service {
  constructor(
    private readonly s3Presigner: {
      putObjectUrl(bucket: string, key: string, contentType: string, expiresIn?: number): Promise<string>;
      getObjectUrl(bucket: string, key: string, expiresIn?: number): Promise<string>;
    },
  ) {}

  /**
   * Creates a presigned upload URL for document upload
   * @param bucket - S3 bucket name
   * @param key - S3 object key
   * @param contentType - Document content type
   * @param fileSize - File size in bytes (optional, for validation)
   * @returns Promise resolving to presigned upload URL and expiration
   */
  async createPresignedUploadUrl(
    bucket: string,
    key: string,
    contentType: ContentType,
    fileSize?: number
  ): Promise<{ url: string; expiresAt: string }> {
    // Validate presign policy using domain rules
    if (fileSize) {
      assertPresignPolicy(contentType, fileSize, 50 * 1024 * 1024); // 50MB max
    }

    const expiresIn = 3600; // 1 hour
    const url = await this.s3Presigner.putObjectUrl(bucket, key, contentType, expiresIn);
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return { url, expiresAt };
  }

  /**
   * Creates a presigned download URL for document access
   * @param bucket - S3 bucket name
   * @param key - S3 object key
   * @param expiresInSeconds - URL expiration time in seconds (default: 3600)
   * @returns Promise resolving to presigned download URL and expiration
   */
  async createPresignedDownloadUrl(
    bucket: string,
    key: string,
    expiresInSeconds: number = 3600
  ): Promise<{ url: string; expiresAt: string }> {
    const url = await this.s3Presigner.getObjectUrl(bucket, key, expiresInSeconds);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    return { url, expiresAt };
  }

  /**
   * Generates S3 object key for document storage
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param documentId - Document identifier
   * @param fileName - Original file name
   * @returns S3 object key
   */
  generateObjectKey(
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    documentId: DocumentId,
    fileName: string
  ): string {
    // Sanitize fileName to prevent path traversal and ensure valid S3 key
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/(^_|_$)/g, '');

    return `documents/${tenantId}/${envelopeId}/${documentId}/${sanitizedFileName}`;
  }

  /**
   * Validates S3 object key format
   * @param key - S3 object key to validate
   * @returns True if key format is valid
   */
  validateObjectKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false;
    }

    // S3 key validation rules:
    // - Must be between 1 and 1024 characters
    // - Cannot start or end with '/'
    // - Cannot contain consecutive '/'
    // - Cannot contain certain special characters
    if (key.length < 1 || key.length > 1024) {
      return false;
    }

    if (key.startsWith('/') || key.endsWith('/')) {
      return false;
    }

    if (key.includes('//')) {
      return false;
    }

    // Check for invalid characters (grouped for explicit precedence)
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(key)) {
      return false;
    }
    
    // Check for control characters using character codes
    for (let i = 0; i < key.length; i++) {
      const charCode = key.charCodeAt(i);
      if (charCode < 32 || charCode === 127) {
        return false;
      }
    }

    return true;
  }
}






