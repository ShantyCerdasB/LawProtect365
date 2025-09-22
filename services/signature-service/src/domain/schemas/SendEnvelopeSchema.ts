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
 * Schema for sending envelope request body
 * @description Defines validation rules for envelope sending requests including
 * message options and signer targeting configuration
 */
export const SendEnvelopeBodySchema = z.object({
  message: z.string().optional(),
  sendToAll: z.boolean().optional().default(false),
  signers: z.array(z.object({
    signerId: z.string().uuid(),
    message: z.string().optional()
  })).optional()
}).refine(
  (data) => data.sendToAll || (data.signers && data.signers.length > 0),
  { message: "Either sendToAll must be true or signers array must be provided" }
);

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
  success: z.boolean(),
  message: z.string(),
  envelopeId: z.string().uuid(),
  status: z.string(),
  tokensGenerated: z.number(),
  signersNotified: z.number()
});
