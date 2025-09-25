/**
 * @fileoverview GetEnvelopeSchema - Schema for retrieving envelope details
 * @summary Validation schemas for envelope retrieval operations
 * @description This file contains Zod schemas for validating envelope retrieval requests,
 * including path parameters and response formatting.
 */

import { z, UuidV4, SignerStatus } from '@lawprotect/shared-ts';
import { EnvelopeCommonFieldsSchema } from './CommonSchemas';

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
 * Schema for signer progress information (aligned with EnvelopeSigner model)
 */
export const SignerProgressSchema = z.object({
  id: z.string().uuid(),
  envelopeId: z.string().uuid(),
  userId: z.string().uuid().optional(), // Linked user when internal
  isExternal: z.boolean().default(false),
  email: z.string().email().optional(), // Required for external signers
  fullName: z.string().optional(),
  invitedByUserId: z.string().uuid().optional(),
  participantRole: z.string().default("SIGNER"),
  order: z.number(),
  status: z.nativeEnum(SignerStatus), // Using Prisma SignerStatus enum
  signedAt: z.string().datetime().optional(),
  declinedAt: z.string().datetime().optional(),
  declineReason: z.string().optional(),
  consentGiven: z.boolean().optional(),
  consentTimestamp: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
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
 * Schema for get envelope response (aligned with SignatureEnvelope model)
 */
export const GetEnvelopeResponseSchema = z.object({
  envelope: z.object({
    // Core fields from Prisma SignatureEnvelope model
    id: z.string().uuid(),
    createdBy: z.string().uuid(),
    title: z.string(),
    description: z.string().optional(),
    status: z.string(), // Will be EnvelopeStatus enum value
    signingOrderType: z.string(), // Will be SigningOrderType enum value
    originType: z.string(), // Will be DocumentOriginType enum value
    
    // Common envelope fields (template, S3 keys, hashes, timestamps)
  }).merge(EnvelopeCommonFieldsSchema).extend({
    // Optional fields for backward compatibility (not in Prisma schema)
    customFields: z.record(z.unknown()).optional(),
    tags: z.array(z.string()).optional(),
    
    // Relations (when included)
    signers: z.array(SignerProgressSchema).optional(),
    progress: EnvelopeProgressSchema.optional()
  })
});
