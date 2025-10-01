/**
 * @fileoverview CancelEnvelopeSchema - Validation schemas for envelope cancellation operations
 * @summary Provides Zod validation schemas for cancelling signature envelopes
 * @description This module defines validation schemas for envelope cancellation operations,
 * including request validation and response formatting. It ensures type safety and data
 * validation for the cancel envelope workflow with proper error handling.
 */

import { z } from 'zod';

/**
 * Schema for envelope cancellation request validation
 * @description Validates cancellation requests for signature envelopes.
 * No body parameters are required for cancellation operations.
 */
export const CancelEnvelopeRequestSchema = z.object({
  // No body parameters needed for cancellation
});

/**
 * Schema for envelope cancellation response validation
 * @description Validates the response structure for envelope cancellation operations,
 * ensuring all required fields are present and properly typed.
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
 * Type definitions derived from validation schemas
 * @description Provides TypeScript types inferred from Zod schemas for type safety
 * throughout the application.
 */
export type CancelEnvelopeRequest = z.infer<typeof CancelEnvelopeRequestSchema>;
export type CancelEnvelopeResponse = z.infer<typeof CancelEnvelopeResponseSchema>;
