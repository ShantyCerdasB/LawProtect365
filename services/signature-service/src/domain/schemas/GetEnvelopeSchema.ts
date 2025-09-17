/**
 * @fileoverview GetEnvelopeSchema - Schema for retrieving envelope details
 * @summary Validation schemas for envelope retrieval operations
 * @description This file contains Zod schemas for validating envelope retrieval requests,
 * including path parameters and response formatting.
 */

import { z, UuidV4 } from '@lawprotect/shared-ts';

/**
 * Schema for envelope ID in path parameters
 */
export const GetEnvelopePathSchema = z.object({
  envelopeId: UuidV4
});

/**
 * Schema for get envelope query parameters
 */
export const GetEnvelopeQuerySchema = z.object({
  includeSigners: z.boolean().optional().default(true),
  includeProgress: z.boolean().optional().default(true),
  includeMetadata: z.boolean().optional().default(true)
});

/**
 * Schema for signer progress information
 */
export const SignerProgressSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  status: z.string(),
  order: z.number(),
  signedAt: z.string().datetime().optional(),
  declinedAt: z.string().datetime().optional()
});

/**
 * Schema for envelope progress summary
 */
export const EnvelopeProgressSchema = z.object({
  total: z.number(),
  signed: z.number(),
  pending: z.number(),
  declined: z.number(),
  percentage: z.number().min(0).max(100)
});

/**
 * Schema for get envelope response
 */
export const GetEnvelopeResponseSchema = z.object({
  envelope: z.object({
    id: z.string().uuid(),
    status: z.string(),
    title: z.string(),
    description: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    createdAt: z.string().datetime(),
    sentAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    customFields: z.record(z.unknown()).optional(),
    tags: z.array(z.string()).optional(),
    signers: z.array(SignerProgressSchema).optional(),
    progress: EnvelopeProgressSchema.optional()
  })
});
