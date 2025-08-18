/**
 * Port for generating presigned S3 URLs without binding to a specific SDK.
 */

export interface PresignGetObjectInput {
  bucket: string;
  key: string;
  expiresInSeconds?: number; // default 900
  responseContentType?: string;
  responseContentDisposition?: string;
}

export interface PresignPutObjectInput {
  bucket: string;
  key: string;
  expiresInSeconds?: number; // default 900
  contentType?: string;
  acl?: "private" | "public-read";
  cacheControl?: string;
  metadata?: Record<string, string>;
  kmsKeyId?: string;
}

/**
 * Presigner interface for S3 GET/PUT URLs.
 * Implementations may use AWS SDK v3 @aws-sdk/s3-request-presigner.
 */
export interface S3Presigner {
  /**
   * Builds a presigned GET Object URL.
   * @param input GET presign parameters.
   */
  getObjectUrl(input: PresignGetObjectInput): Promise<string>;

  /**
   * Builds a presigned PUT Object URL.
   * @param input PUT presign parameters.
   */
  putObjectUrl(input: PresignPutObjectInput): Promise<string>;
}
