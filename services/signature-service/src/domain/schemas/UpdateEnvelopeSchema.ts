/**
 * @fileoverview UpdateEnvelopeSchema - Schema for updating existing envelopes
 * @summary Validation schemas for envelope update operations
 * @description This file contains Zod schemas for validating envelope update requests,
 * including path parameters, request body, and response formatting.
 */

import { z, UuidV4, NonEmptyStringSchema } from '@lawprotect/shared-ts';
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
  signerData: SignerDataSchema.optional()
});

/**
 * Schema for updating envelope metadata
 */
export const UpdateEnvelopeMetadataSchema = z.object({
  title: NonEmptyStringSchema.max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  expiresAt: z.date().optional(),
  customFields: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional()
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
    status: z.string(),
    title: z.string(),
    description: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime(),
    signers: z.array(z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      fullName: z.string(),
      status: z.string(),
      order: z.number()
    }))
  })
});
