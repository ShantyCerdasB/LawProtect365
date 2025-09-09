/**
 * @file types.ts
 * @summary S3 implementation types
 * @description Types for S3 implementations
 */

export interface S3PresignerOptions {
  defaultTtl?: number;
  defaultAcl?: "private" | "public-read";
  defaultCacheControl?: string;
  defaultKmsKeyId?: string;
}

export interface S3EvidenceStorageOptions {
  maxAttempts?: number;
  defaultBucket?: string;
  defaultKmsKeyId?: string;
  defaultCacheControl?: string;
  defaultAcl?: "private" | "public-read";
}

export interface HeadResult {
  exists: boolean;
  size?: number;
  etag?: string;
  lastModified?: Date;
  metadata?: Record<string, string>;
}





