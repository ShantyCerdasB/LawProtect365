/**
 * @file s3.ts
 * @summary S3-specific types and interfaces
 * @description Shared types for S3 operations, storage, and presigning
 */

/**
 * @summary S3 object reference
 * @description Represents an S3 object with bucket and key information.
 */
export interface S3ObjectRef {
  /** S3 bucket name */
  readonly bucket: string;
  /** S3 object key */
  readonly key: string;
  /** Optional S3 object version */
  readonly version?: string;
}

/**
 * @summary S3 upload parameters
 * @description Parameters for uploading files to S3.
 */
export interface S3UploadParams {
  /** S3 bucket name */
  readonly bucket: string;
  /** S3 object key */
  readonly key: string;
  /** File content as buffer */
  readonly body: Buffer;
  /** Content type of the file */
  readonly contentType: string;
  /** Optional metadata */
  readonly metadata?: Record<string, string>;
  /** Optional cache control */
  readonly cacheControl?: string;
  /** Whether to make the object public */
  readonly public?: boolean;
}

/**
 * @summary S3 download parameters
 * @description Parameters for downloading files from S3.
 */
export interface S3DownloadParams {
  /** S3 bucket name */
  readonly bucket: string;
  /** S3 object key */
  readonly key: string;
  /** Optional S3 object version */
  readonly version?: string;
}

/**
 * @summary S3 presigned URL parameters
 * @description Parameters for generating presigned URLs.
 */
export interface S3PresignedUrlParams {
  /** S3 bucket name */
  readonly bucket: string;
  /** S3 object key */
  readonly key: string;
  /** HTTP method for the presigned URL */
  readonly method: "GET" | "PUT" | "POST" | "DELETE";
  /** Expiration time in seconds */
  readonly expiresIn: number;
  /** Optional content type */
  readonly contentType?: string;
  /** Optional metadata */
  readonly metadata?: Record<string, string>;
}

/**
 * @summary S3 bucket configuration
 * @description Configuration for S3 buckets used by the application.
 */
export interface S3BucketConfig {
  /** Bucket name */
  readonly name: string;
  /** AWS region */
  readonly region: string;
  /** Whether the bucket is public */
  readonly public: boolean;
  /** Optional KMS key for encryption */
  readonly kmsKeyId?: string;
  /** Optional CORS configuration */
  readonly cors?: {
    readonly allowedOrigins: string[];
    readonly allowedMethods: string[];
    readonly allowedHeaders: string[];
    readonly maxAgeSeconds: number;
  };
}

/**
 * @summary S3 object metadata
 * @description Metadata for S3 objects.
 */
export interface S3ObjectMetadata {
  /** Object key */
  readonly key: string;
  /** Object size in bytes */
  readonly size: number;
  /** Content type */
  readonly contentType: string;
  /** Last modified timestamp */
  readonly lastModified: string;
  /** Object ETag */
  readonly etag: string;
  /** Object version ID */
  readonly versionId?: string;
  /** User-defined metadata */
  readonly metadata?: Record<string, string>;
}

/**
 * @summary S3 evidence storage options
 * @description Configuration options for S3 evidence storage.
 */
export interface S3EvidenceStorageOptions {
  /** S3 bucket name for evidence storage */
  readonly bucket: string;
  /** AWS region */
  readonly region: string;
  /** Optional KMS key for encryption */
  readonly kmsKeyId?: string;
  /** Default cache control */
  readonly defaultCacheControl?: string;
  /** Whether to make objects public by default */
  readonly defaultPublic: boolean;
  /** Maximum file size in bytes */
  readonly maxFileSize: number;
  /** Allowed content types */
  readonly allowedContentTypes: string[];
}

/**
 * @summary S3 head operation result
 * @description Result of checking if an S3 object exists.
 */
export type HeadResult = {
  /** Whether the object exists */
  readonly exists: true;
  /** Object metadata */
  readonly metadata: S3ObjectMetadata;
} | {
  /** Whether the object exists */
  readonly exists: false;
  /** Error information */
  readonly error?: string;
};

