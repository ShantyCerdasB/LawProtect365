/**
 * @fileoverview ShareDocumentViewSchema - Schema for document view sharing
 * @summary Validation schemas for sharing document view access
 * @description This file contains Zod schemas for validating requests to share
 * document view access with external users who can only view (not sign) documents.
 */

import { z } from 'zod';

/**
 * Schema for sharing document view access
 */
export const ShareDocumentViewPathSchema = z.object({
  envelopeId: z.string().uuid('Invalid envelope ID format')
});

/**
 * Schema for share document view request body
 */
export const ShareDocumentViewBodySchema = z.object({
  /** Email address of the viewer */
  email: z.string().email('Invalid email format'),
  /** Full name of the viewer */
  fullName: z.string().min(1, 'Full name is required'),
  /** Optional custom message for the viewer */
  message: z.string().optional(),
  /** Optional expiration time in days (default: 7 days) */
  expiresIn: z.number().min(1, 'Expiration must be at least 1 day').max(365, 'Expiration cannot exceed 365 days').optional()
});

/**
 * Schema for share document view response
 */
export const ShareDocumentViewResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  envelopeId: z.string(),
  viewerEmail: z.string(),
  viewerName: z.string(),
  token: z.string(),
  expiresAt: z.string(),
  expiresInDays: z.number()
});

/**
 * Type definitions derived from schemas
 */
export type ShareDocumentViewPath = z.infer<typeof ShareDocumentViewPathSchema>;
export type ShareDocumentViewBody = z.infer<typeof ShareDocumentViewBodySchema>;
export type ShareDocumentViewResponse = z.infer<typeof ShareDocumentViewResponseSchema>;
