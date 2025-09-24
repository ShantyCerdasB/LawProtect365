/**
 * @fileoverview CancelEnvelopeSchema - Request and response schemas for envelope cancellation
 * @summary Schema definitions for cancel envelope operations
 * @description Defines the request and response schemas for cancelling signature envelopes,
 * including validation rules and type definitions for the cancel envelope workflow.
 */

import { z } from 'zod';

/**
 * Request schema for cancelling an envelope
 * No body parameters are required for cancellation
 */
export const CancelEnvelopeRequestSchema = z.object({
  // No body parameters needed for cancellation
});

/**
 * Response schema for envelope cancellation
 */
export const CancelEnvelopeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  envelope: z.object({
    id: z.string(),
    status: z.string(),
    title: z.string(),
    cancelledAt: z.string().optional()
  })
});

/**
 * Type definitions for cancel envelope operations
 */
export type CancelEnvelopeRequest = z.infer<typeof CancelEnvelopeRequestSchema>;
export type CancelEnvelopeResponse = z.infer<typeof CancelEnvelopeResponseSchema>;
