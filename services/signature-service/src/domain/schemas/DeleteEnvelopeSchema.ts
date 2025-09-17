/**
 * @fileoverview DeleteEnvelopeSchema - Schema for deleting envelopes
 * @summary Validation schemas for envelope deletion operations
 * @description This file contains Zod schemas for validating envelope deletion requests,
 * including path parameters and response formatting.
 */

import { z, UuidV4 } from '@lawprotect/shared-ts';

/**
 * Schema for envelope ID in path parameters
 */
export const DeleteEnvelopePathSchema = z.object({
  envelopeId: UuidV4
});

/**
 * Schema for delete envelope response
 */
export const DeleteEnvelopeResponseSchema = z.object({
  message: z.string(),
  deletedAt: z.string().datetime()
});
