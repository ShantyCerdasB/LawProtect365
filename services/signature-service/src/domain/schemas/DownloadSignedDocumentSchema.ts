/**
 * @fileoverview DownloadSignedDocumentSchema - Schema for downloading signed documents
 * @summary Validation schemas for signed document download operations
 * @description This file contains Zod schemas for validating signed document download requests,
 * including path parameters and response formatting.
 */

import { z, UuidV4 } from '@lawprotect/shared-ts';

/**
 * Schema for envelope ID in path parameters
 */
export const DownloadSignedDocumentPathSchema = z.object({
  envelopeId: UuidV4
});

/**
 * Schema for download signed document query parameters
 */
export const DownloadSignedDocumentQuerySchema = z.object({
  expiresIn: z.number().min(300).max(3600).optional().default(3600), // 5 minutes to 1 hour
  format: z.enum(['pdf', 'original']).optional().default('pdf')
});

/**
 * Schema for download signed document response
 */
export const DownloadSignedDocumentResponseSchema = z.object({
  downloadUrl: z.string().url(),
  expiresAt: z.string().datetime(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number().optional()
});
