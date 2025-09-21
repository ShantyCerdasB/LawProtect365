/**
 * @fileoverview S3OperationType enum - S3 operation types for presigned URLs
 * @summary Enum for S3 operation types
 * @description Defines the available operation types for S3 presigned URLs
 * used in document storage and retrieval operations.
 */

/**
 * S3 operation types for presigned URLs
 * 
 * Defines the available operation types for S3 presigned URLs
 * used in document storage and retrieval operations.
 */
export enum S3OperationType {
  /**
   * Get operation - for downloading/viewing documents
   */
  GET = 'get',
  
  /**
   * Put operation - for uploading/updating documents
   */
  PUT = 'put'
}
