/**
 * @fileoverview DownloadDocumentSchema - Schema for downloading documents
 * @summary Validation schemas for document download operations
 * @description This file contains Zod schemas for validating document download requests,
 * including path parameters, query parameters for both authenticated and external users,
 * and response formatting.
 */

import { z, UuidV4, DocumentDownloadFormat } from '@lawprotect/shared-ts';

/**
 * Schema for envelope ID in path parameters
 */
export const DownloadDocumentPathSchema = z.object({
  envelopeId: UuidV4
});

/**
 * Schema for download document query parameters
 * Supports both authenticated users and external users with invitation tokens
 */
export const DownloadDocumentQuerySchema = z.object({
  expiresIn: z.string().optional()
    .transform((val) => val ? parseInt(val, 10) : undefined)
    .refine((val) => {
      if (val === undefined) return true;
      if (isNaN(val)) return false;
      
      // Import configuration dynamically to avoid circular dependencies
      const { loadConfig } = require('../../config/AppConfig');
      const config = loadConfig();
      return val >= config.documentDownload.minExpirationSeconds && 
             val <= config.documentDownload.maxExpirationSeconds;
    }, {
      message: "Expiration time must be within configured limits"
    }),
  invitationToken: z.string().optional() // For external users
});

/**
 * Schema for download document response
 */
export const DownloadDocumentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  downloadUrl: z.string().url(),
  expiresIn: z.number(),
  expiresAt: z.string().datetime()
});

/**
 * Type exports
 */
export type DownloadDocumentPath = z.infer<typeof DownloadDocumentPathSchema>;
export type DownloadDocumentQuery = z.infer<typeof DownloadDocumentQuerySchema>;
export type DownloadDocumentResponse = z.infer<typeof DownloadDocumentResponseSchema>;
