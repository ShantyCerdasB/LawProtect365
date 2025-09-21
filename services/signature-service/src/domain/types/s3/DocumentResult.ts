/**
 * @fileoverview DocumentResult - Interface for document operation results
 * @summary Defines data structure for document operation results
 * @description This interface provides type-safe specifications for document operation
 * results, including metadata, location, and content information.
 */

export interface DocumentResult {
  documentKey: string;
  s3Location: string;
  contentType: string;
  size?: number;
  lastModified?: Date;
}