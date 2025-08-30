/**
 * @file Upload.ts
 * @summary Value objects and schema for upload operations
 * @description Defines the value objects for evidence uploads, multipart uploads, and upload sessions
 */

import { z } from "zod";
import type { EnvelopeId, AllowedContentType, EvidenceType } from "./index";

/**
 * @description Upload session for multipart uploads
 */
export const UploadSessionSchema = z.object({
  /** Upload session identifier */
  uploadId: z.string(),
  /** S3 bucket name */
  bucket: z.string(),
  /** S3 object key */
  key: z.string(),
  /** Size of each part in bytes */
  partSize: z.number().int().positive(),
  /** Array of presigned URLs for each part */
  urls: z.array(z.object({
    /** Part number */
    partNumber: z.number().int().positive(),
    /** Presigned URL for this part */
    url: z.string().url(),
  })),
  /** Object reference for tracking */
  objectRef: z.string(),
  /** Expiration timestamp */
  expiresAt: z.string().datetime(),
});

export type UploadSession = z.infer<typeof UploadSessionSchema>;

/**
 * @description Evidence metadata for uploaded files
 */
export const EvidenceMetadataSchema = z.object({
  /** Envelope identifier */
  envelopeId: z.string(),
  /** Content type of the file */
  contentType: z.string(),
  /** File size in bytes */
  sizeBytes: z.number().int().positive(),
  /** Type of evidence */
  evidenceType: z.enum(["photo", "video", "audio", "document", "screenshot"]),
  /** Optional SHA256 hash for integrity */
  sha256: z.string().optional(),
  /** Upload timestamp */
  uploadedAt: z.string().datetime(),
});

export type EvidenceMetadata = z.infer<typeof EvidenceMetadataSchema>;

/**
 * @description Multipart upload part information
 */
export const MultipartPartSchema = z.object({
  /** Part number */
  partNumber: z.number().int().positive(),
  /** ETag returned by S3 */
  etag: z.string(),
});

export type MultipartPart = z.infer<typeof MultipartPartSchema>;

/**
 * @description Input for presigning evidence upload
 */
export const PresignEvidenceInputSchema = z.object({
  /** Envelope identifier */
  envelopeId: z.string(),
  /** Content type of the file */
  contentType: z.string(),
  /** Estimated file size in bytes */
  sizeBytes: z.number().int().positive(),
  /** Optional number of parts for multipart upload */
  parts: z.number().int().positive().optional(),
  /** Optional SHA256 hash for integrity */
  sha256: z.string().optional(),
});

export type PresignEvidenceInput = z.infer<typeof PresignEvidenceInputSchema>;

/**
 * @description Result of presigning evidence upload
 */
export const PresignEvidenceResultSchema = z.object({
  /** Upload session identifier */
  uploadId: z.string(),
  /** S3 bucket name */
  bucket: z.string(),
  /** S3 object key */
  key: z.string(),
  /** Size of each part in bytes */
  partSize: z.number().int().positive(),
  /** Array of presigned URLs for each part */
  urls: z.array(z.object({
    /** Part number */
    partNumber: z.number().int().positive(),
    /** Presigned URL for this part */
    url: z.string().url(),
  })),
  /** Object reference for tracking */
  objectRef: z.string(),
});

export type PresignEvidenceResult = z.infer<typeof PresignEvidenceResultSchema>;

/**
 * @description Input for completing multipart upload
 */
export const CompleteEvidenceInputSchema = z.object({
  /** Upload session identifier */
  uploadId: z.string(),
  /** S3 bucket name */
  bucket: z.string(),
  /** S3 object key */
  key: z.string(),
  /** Array of completed parts */
  parts: z.array(MultipartPartSchema),
  /** Optional object reference */
  objectRef: z.string().optional(),
});

export type CompleteEvidenceInput = z.infer<typeof CompleteEvidenceInputSchema>;

/**
 * @description Result of completing multipart upload
 */
export const CompleteEvidenceResultSchema = z.object({
  /** Object reference */
  objectRef: z.string(),
  /** Optional version ID */
  versionId: z.string().optional(),
});

export type CompleteEvidenceResult = z.infer<typeof CompleteEvidenceResultSchema>;

/**
 * @description Input for uploading signed PDF
 */
export const UploadSignedPdfInputSchema = z.object({
  /** Envelope identifier */
  envelopeId: z.string(),
  /** Content length in bytes */
  contentLength: z.number().int().positive(),
  /** Optional SHA256 hash */
  sha256: z.string().optional(),
});

export type UploadSignedPdfInput = z.infer<typeof UploadSignedPdfInputSchema>;

/**
 * @description Result of uploading signed PDF
 */
export const UploadSignedPdfResultSchema = z.object({
  /** Object reference */
  objectRef: z.string(),
  /** Optional version ID */
  versionId: z.string().optional(),
});

export type UploadSignedPdfResult = z.infer<typeof UploadSignedPdfResultSchema>;
