/**
 * @fileoverview SigningSchema - Zod schemas for signing process validation
 * @summary Validation schemas for signing requests and responses
 * @description The SigningSchema provides Zod validation schemas for signing-related
 * operations including signing requests, responses, and validation.
 */

import { z, UuidV4, NonEmptyStringSchema } from '@lawprotect/shared-ts';
import { SignatureStatus, SignatureSortBy, SortOrder } from '@/domain/enums';

/**
 * Schema for signing a document
 */
export const SigningRequestSchema = z.object({
  envelopeId: UuidV4,
  signerId: UuidV4,
  documentHash: z.string().regex(/^[a-f0-9]{64}$/i, 'Document hash must be a valid SHA-256 hash'),
  algorithm: NonEmptyStringSchema,
  kmsKeyId: NonEmptyStringSchema,
  reason: z.string().max(255, 'Reason must be less than 255 characters').optional(),
  location: z.string().max(255, 'Location must be less than 255 characters').optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional()
});

/**
 * Schema for declining to sign
 */
export const DeclineRequestSchema = z.object({
  envelopeId: UuidV4,
  signerId: UuidV4,
  reason: z.string().max(500, 'Decline reason must be less than 500 characters').optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional()
});

/**
 * Schema for signature ID parameter
 */
export const SignatureIdSchema = z.object({
  signatureId: UuidV4
});

/**
 * Schema for signature status
 */
export const SignatureStatusSchema = z.nativeEnum(SignatureStatus);

/**
 * Schema for signature validation
 */
export const SignatureValidationSchema = z.object({
  signatureId: UuidV4,
  documentHash: z.string().regex(/^[a-f0-9]{64}$/i, 'Document hash must be a valid SHA-256 hash'),
  signatureHash: z.string().regex(/^[a-f0-9]{64}$/i, 'Signature hash must be a valid SHA-256 hash')
});

/**
 * Schema for signature query parameters
 */
export const SignatureQuerySchema = z.object({
  envelopeId: UuidV4.optional(),
  signerId: UuidV4.optional(),
  status: SignatureStatusSchema.optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.nativeEnum(SignatureSortBy).default(SignatureSortBy.TIMESTAMP),
  sortOrder: z.nativeEnum(SortOrder).default(SortOrder.DESC)
});

/**
 * Schema for signing response
 */
export const SigningResponseSchema = z.object({
  signatureId: UuidV4,
  envelopeId: UuidV4,
  signerId: UuidV4,
  s3Key: NonEmptyStringSchema,
  signatureHash: z.string().regex(/^[a-f0-9]{64}$/i, 'Signature hash must be a valid SHA-256 hash'),
  timestamp: z.date(),
  algorithm: NonEmptyStringSchema,
  kmsKeyId: NonEmptyStringSchema
});

/**
 * Type inference from schemas
 */
export type SigningRequest = z.infer<typeof SigningRequestSchema>;
export type DeclineRequest = z.infer<typeof DeclineRequestSchema>;
export type SignatureIdParams = z.infer<typeof SignatureIdSchema>;
export type SignatureValidationRequest = z.infer<typeof SignatureValidationSchema>;
export type SignatureQuery = z.infer<typeof SignatureQuerySchema>;
export type SigningResponse = z.infer<typeof SigningResponseSchema>;
