/**
 * @fileoverview DownloadSignedDocumentSchema - Validation schemas for document download operations
 * @summary Provides Zod validation schemas for downloading signed documents from envelopes
 * @description This module defines comprehensive validation schemas for document download operations,
 * supporting both authenticated users and external users with invitation tokens. It includes
 * path parameter validation, query parameter validation with expiration limits, and response
 * formatting for secure document downloads.
 */

import { z, UuidV4 } from '@lawprotect/shared-ts';
import { loadConfig } from '../../config/AppConfig';

/**
 * Schema for envelope ID path parameter validation
 * @description Validates the envelope ID in the URL path for document download requests
 */
export const DownloadDocumentPathSchema = z.object({
  envelopeId: UuidV4
});

/**
 * Schema for download document query parameters validation
 * @description Validates query parameters for document download requests, supporting both
 * authenticated users and external users with invitation tokens. Includes expiration
 * time validation against configured limits.
 */
export const DownloadDocumentQuerySchema = z.object({
  expiresIn: z.string().optional()
    .transform((val) => val ? Number.parseInt(val, 10) : undefined)
    .refine((val) => {
      if (val === undefined) return true;
      if (Number.isNaN(val)) return false;
      
      // Load configuration to validate expiration limits
      const config = loadConfig();
      return val >= config.documentDownload.minExpirationSeconds && 
             val <= config.documentDownload.maxExpirationSeconds;
    }, {
      message: "Expiration time must be within configured limits"
    }),
  invitationToken: z.string().optional() // For external users
});

/**
 * Schema for download document response validation
 * @description Validates the response structure for document download operations,
 * ensuring all required fields are present and properly typed.
 */
export const DownloadDocumentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  downloadUrl: z.string().url(),
  expiresIn: z.number(),
  expiresAt: z.string().datetime()
});

/**
 * Type definitions derived from validation schemas
 * @description Provides TypeScript types inferred from Zod schemas for type safety
 * throughout the application.
 */
export type DownloadDocumentPath = z.infer<typeof DownloadDocumentPathSchema>;
export type DownloadDocumentQuery = z.infer<typeof DownloadDocumentQuerySchema>;
export type DownloadDocumentResponse = z.infer<typeof DownloadDocumentResponseSchema>;
