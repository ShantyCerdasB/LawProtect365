/**
 * @fileoverview UpdateEnvelopeSchema - Schema for updating existing envelopes
 * @summary Validation schemas for envelope update operations
 * @description This file contains Zod schemas for validating envelope update requests,
 * including path parameters, request body, and response formatting.
 */

import { z, UuidV4, NonEmptyStringSchema } from '@lawprotect/shared-ts';
import { EnvelopeStatus, SigningOrderType, DocumentOriginType, SignerStatus } from '@prisma/client';
import { SignerDataSchema } from './CommonSchemas';

/**
 * Schema for envelope ID in path parameters
 */
export const UpdateEnvelopePathSchema = z.object({
  envelopeId: UuidV4
});

/**
 * Schema for signer update operations
 */
export const SignerUpdateSchema = z.object({
  action: z.enum(['add', 'remove', 'update']),
  signerId: UuidV4.optional(),
  signerData: SignerDataSchema.optional(),
  // Additional fields for signer updates
  status: z.nativeEnum(SignerStatus).optional(),
  order: z.number().min(1).optional(),
  userId: UuidV4.optional() // For linking to internal users
});

/**
 * Schema for updating envelope metadata
 */
export const UpdateEnvelopeMetadataSchema = z.object({
  title: NonEmptyStringSchema.max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  status: z.nativeEnum(EnvelopeStatus).optional(),
  signingOrderType: z.nativeEnum(SigningOrderType).optional(),
  originType: z.nativeEnum(DocumentOriginType).optional(),
  templateId: z.string().optional(),
  templateVersion: z.string().optional(),
  expiresAt: z.date().optional(),
  customFields: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  // S3 keys (usually not updated, but included for completeness)
  sourceKey: z.string().optional(),
  metaKey: z.string().optional(),
  flattenedKey: z.string().optional(),
  signedKey: z.string().optional(),
  // Content integrity hashes
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/i, 'Source hash must be a valid SHA-256 hash').optional(),
  flattenedSha256: z.string().regex(/^[a-f0-9]{64}$/i, 'Flattened hash must be a valid SHA-256 hash').optional(),
  signedSha256: z.string().regex(/^[a-f0-9]{64}$/i, 'Signed hash must be a valid SHA-256 hash').optional()
});

/**
 * Schema for update envelope request body
 */
export const UpdateEnvelopeBodySchema = z.object({
  metadata: UpdateEnvelopeMetadataSchema.optional(),
  signerUpdates: z.array(SignerUpdateSchema).optional()
});

/**
 * Schema for update envelope response
 */
export const UpdateEnvelopeResponseSchema = z.object({
  message: z.string(),
  envelope: z.object({
    id: z.string().uuid(),
    createdBy: z.string().uuid(),
    title: z.string(),
    description: z.string().optional(),
    status: z.nativeEnum(EnvelopeStatus),
    signingOrderType: z.nativeEnum(SigningOrderType),
    originType: z.nativeEnum(DocumentOriginType),
    templateId: z.string().optional(),
    templateVersion: z.string().optional(),
    // S3 keys
    sourceKey: z.string().optional(),
    metaKey: z.string().optional(),
    flattenedKey: z.string().optional(),
    signedKey: z.string().optional(),
    // Content integrity hashes
    sourceSha256: z.string().optional(),
    flattenedSha256: z.string().optional(),
    signedSha256: z.string().optional(),
    // Lifecycle timestamps
    sentAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    cancelledAt: z.string().datetime().optional(),
    declinedAt: z.string().datetime().optional(),
    declinedBySignerId: z.string().uuid().optional(),
    declinedReason: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    // Audit timestamps
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    signers: z.array(z.object({
      id: z.string().uuid(),
      envelopeId: z.string().uuid(),
      userId: z.string().uuid().optional(),
      email: z.string().email(),
      fullName: z.string(),
      status: z.nativeEnum(SignerStatus),
      order: z.number(),
      signedAt: z.string().datetime().optional(),
      declinedAt: z.string().datetime().optional(),
      declinedReason: z.string().optional(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime()
    }))
  })
});
