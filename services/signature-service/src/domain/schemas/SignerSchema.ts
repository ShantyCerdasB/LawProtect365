/**
 * @fileoverview SignerSchema - Zod schemas for signer validation
 * @summary Validation schemas for signer creation and updates
 * @description The SignerSchema provides Zod validation schemas for signer-related
 * operations including creation, updates, and status management.
 */

import { z, UuidV4, NonEmptyStringSchema, EmailStringSchema, SignerStatus, SignerSortBy, SortOrder } from '@lawprotect/shared-ts';
import { SignerDataSchema } from './CommonSchemas';

/**
 * Schema for creating a new signer
 */
export const CreateSignerSchema = z.object({
  envelopeId: UuidV4,
  ...SignerDataSchema.shape,
  invitationToken: z.string().optional()
});

/**
 * Schema for updating a signer
 */
export const UpdateSignerSchema = z.object({
  fullName: NonEmptyStringSchema.max(255, 'Full name must be less than 255 characters').optional(),
  order: z.number().min(1, 'Order must be at least 1').optional()
});

/**
 * Schema for signer ID parameter
 */
export const SignerIdSchema = z.object({
  signerId: UuidV4
});

/**
 * Schema for signer status
 */
export const SignerStatusSchema = z.nativeEnum(SignerStatus);

/**
 * Schema for signer consent
 */
export const SignerConsentSchema = z.object({
  signerId: UuidV4,
  consentGiven: z.boolean(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional()
});

/**
 * Schema for signer decline
 */
export const SignerDeclineSchema = z.object({
  signerId: UuidV4,
  reason: z.string().max(500, 'Decline reason must be less than 500 characters').optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional()
});

/**
 * Schema for signer query parameters
 */
export const SignerQuerySchema = z.object({
  envelopeId: UuidV4.optional(),
  status: SignerStatusSchema.optional(),
  email: EmailStringSchema.optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.nativeEnum(SignerSortBy).default(SignerSortBy.ORDER),
  sortOrder: z.nativeEnum(SortOrder).default(SortOrder.ASC)
});

/**
 * Type inference from schemas
 */
export type CreateSignerRequest = z.infer<typeof CreateSignerSchema>;
export type UpdateSignerRequest = z.infer<typeof UpdateSignerSchema>;
export type SignerIdParams = z.infer<typeof SignerIdSchema>;
export type SignerConsentRequest = z.infer<typeof SignerConsentSchema>;
export type SignerDeclineRequest = z.infer<typeof SignerDeclineSchema>;
export type SignerQuery = z.infer<typeof SignerQuerySchema>;
