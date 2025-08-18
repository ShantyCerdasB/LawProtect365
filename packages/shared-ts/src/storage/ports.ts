/**
 * Options for object upload.
 */
export interface PutObjectOptions {
  contentType?: string;
  encryptionKeyId?: string;
  metadata?: Record<string, string>;
}

/**
 * Options to create a pre-signed URL.
 */
export interface PresignOptions {
  method: "GET" | "PUT" | "DELETE";
  expiresInSeconds: number;
  contentType?: string;
}

/**
 * Object storage abstraction.
 */
export interface ObjectStoragePort {
  putObject(bucket: string, key: string, body: Uint8Array | Buffer | string, opts?: PutObjectOptions): Promise<void>;
  getObject(bucket: string, key: string): Promise<Uint8Array>;
  headObject(
    bucket: string,
    key: string
  ): Promise<{ size: number; etag?: string; lastModified?: string; metadata?: Record<string, string> }>;
  deleteObject(bucket: string, key: string): Promise<void>;
  presign(bucket: string, key: string, opts: PresignOptions): Promise<string>;
}
