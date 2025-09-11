/**
 * @file S3SignedPdfIngestorTypes.ts
 * @summary Types for S3 signed PDF ingestor operations
 * @description Defines interfaces and types for S3 signed PDF ingestor functionality
 */

/**
 * Input parameters for S3SignedPdfIngestor.ingest.
 */
export interface SignedPdfIngestInput {
  /** Target S3 bucket. Falls back to S3SignedPdfIngestorOptions.defaultBucket. */
  bucket?: string;
  /** Object key within the bucket. */
  key: string;
  /**
   * AWS region of the bucket. If omitted, falls back to
   * S3SignedPdfIngestorOptions.defaultRegion or environment via requireRegion.
   */
  region?: string;
  /** PDF binary data. */
  body: Uint8Array | Buffer;
  /** Optional `Cache-Control` header value. Falls back to constructor default. */
  cacheControl?: string;
  /** Optional KMS key ARN/ID for SSE-KMS encryption. Falls back to constructor default. */
  kmsKeyId?: string;
  /** Optional user-defined metadata. */
  metadata?: Record<string, string>;
  /**
   * Whether to return a path-style URL instead of virtual-hosted.
   * Falls back to S3SignedPdfIngestorOptions.defaultPathStyleUrl.
   * @defaultValue false (virtual-hosted)
   */
  pathStyleUrl?: boolean;
}

/**
 * Output returned by S3SignedPdfIngestor.ingest.
 */
export interface SignedPdfIngestOutput {
  /** ETag returned by S3, if present. */
  etag?: string;
  /** VersionId of the object (when bucket versioning is enabled). */
  versionId?: string;
  /** HTTPS URL pointing to the stored PDF. */
  httpUrl: string;
}

/**
 * Construction options for S3SignedPdfIngestor.
 * Defaults are applied only if the corresponding per-call fields are omitted.
 */
export interface S3SignedPdfIngestorOptions {
  /** Default bucket name. */
  defaultBucket?: string;
  /**
   * Default AWS region used to build the HTTPS URL and as fallback for `ingest()`.
   * If not provided, requireRegion will read it from the environment.
   */
  defaultRegion?: string;
  /** Default KMS key ARN/ID for SSE-KMS. */
  defaultKmsKeyId?: string;
  /** Default Cache-Control header. */
  defaultCacheControl?: string;
  /** Default path-style URL preference (if true, use path-style). */
  defaultPathStyleUrl?: boolean;
}
