/**
 * @fileoverview SendEnvelopeSchema - Schema for sending envelopes
 * @summary Validation schemas for envelope sending operations
 * @description This file contains Zod schemas for validating envelope sending requests,
 * including path parameters and request body validation.
 */

import { z, UuidV4 } from '@lawprotect/shared-ts';

/**
 * Schema for envelope ID in path parameters
 */
export const SendEnvelopePathSchema = z.object({
  envelopeId: UuidV4
});

/**
 * Schema for sending envelope request body (currently empty, but can be extended)
 */
export const SendEnvelopeBodySchema = z.object({
  // Future: could include custom message, reminder settings, etc.
}).optional();

/**
 * Combined schema for send envelope request
 */
export const SendEnvelopeRequestSchema = z.object({
  path: SendEnvelopePathSchema,
  body: SendEnvelopeBodySchema
});

/**
 * Schema for send envelope response
 */
export const SendEnvelopeResponseSchema = z.object({
  message: z.string(),
  envelope: z.object({
    id: z.string().uuid(),
    status: z.string(),
    sentAt: z.string().datetime().optional(),
    title: z.string()
  })
});
