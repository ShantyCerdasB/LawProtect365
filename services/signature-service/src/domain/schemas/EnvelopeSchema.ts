/**
 * @fileoverview EnvelopeSchema - Zod schemas for envelope validation
 * @summary Validation schemas for envelope creation and updates
 * @description The EnvelopeSchema provides Zod validation schemas for envelope-related
 * operations including creation, updates, and status transitions.
 */

import { z, UuidV4, NonEmptyStringSchema, JsonObjectSchema, EnvelopeStatus, SigningOrderType, DocumentOriginType, EnvelopeSortBy, SortOrder } from '@lawprotect/shared-ts';
import { SignerDataSchema } from './CommonSchemas';

/**
 * Schema for creating a new envelope with signers
 */
export const CreateEnvelopeWithSignersSchema = z.object({
  documentId: UuidV4,
  createdBy: NonEmptyStringSchema, // Changed from ownerId to createdBy to match Prisma schema
  title: NonEmptyStringSchema.max(255, 'Title must be less than 255 characters'), // Direct field from Prisma
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(), // Direct field from Prisma
  signingOrderType: z.nativeEnum(SigningOrderType), // Changed from signingOrder to signingOrderType
  originType: z.nativeEnum(DocumentOriginType), // From Prisma DocumentOriginType enum
  templateId: z.string().optional(), // Direct field from Prisma
  templateVersion: z.string().optional(), // Direct field from Prisma
  // S3 pipeline keys (optional during creation, set by Document Service)
  sourceKey: z.string().optional(), // From Prisma schema
  metaKey: z.string().optional(), // From Prisma schema
  flattenedKey: z.string().optional(), // From Prisma schema
  signedKey: z.string().optional(), // From Prisma schema
  // Content integrity hashes (optional during creation, set by Document Service)
  sourceSha256: z.string().optional(), // From Prisma schema
  flattenedSha256: z.string().optional(), // From Prisma schema
  signedSha256: z.string().optional(), // From Prisma schema
  expiresAt: z.date().optional(), // Direct field from Prisma
  signers: z.array(SignerDataSchema).optional()
});

/**
 * Schema for creating a new envelope (original, without signers)
 */
export const CreateEnvelopeSchema = z.object({
  documentId: UuidV4,
  createdBy: NonEmptyStringSchema, // Changed from ownerId to createdBy to match Prisma schema
  title: NonEmptyStringSchema.max(255, 'Title must be less than 255 characters'), // Direct field from Prisma
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(), // Direct field from Prisma
  signingOrderType: z.nativeEnum(SigningOrderType), // Changed from signingOrder to signingOrderType
  originType: z.nativeEnum(DocumentOriginType), // From Prisma DocumentOriginType enum
  templateId: z.string().optional(), // Direct field from Prisma
  templateVersion: z.string().optional(), // Direct field from Prisma
  // S3 pipeline keys (optional during creation, set by Document Service)
  sourceKey: z.string().optional(), // From Prisma schema
  metaKey: z.string().optional(), // From Prisma schema
  flattenedKey: z.string().optional(), // From Prisma schema
  signedKey: z.string().optional(), // From Prisma schema
  // Content integrity hashes (optional during creation, set by Document Service)
  sourceSha256: z.string().optional(), // From Prisma schema
  flattenedSha256: z.string().optional(), // From Prisma schema
  signedSha256: z.string().optional(), // From Prisma schema
  expiresAt: z.date().optional() // Direct field from Prisma
});

/**
 * Schema for updating an envelope
 */
export const UpdateEnvelopeSchema = z.object({
  title: NonEmptyStringSchema.max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  expiresAt: z.date().optional(), customFields: JsonObjectSchema.optional(),
  tags: z.array(z.string()).optional(),
  reminders: z.object({
    daysBeforeExpiration: z.number().min(1).max(365).optional(),
    firstReminderDays: z.number().min(1).max(30).optional(),
    secondReminderDays: z.number().min(1).max(30).optional()
  }).optional()
});

/**
 * Schema for envelope ID parameter
 */
export const EnvelopeIdSchema = z.object({
  id: UuidV4
});

/**
 * Schema for envelope status
 */
export const EnvelopeStatusSchema = z.nativeEnum(EnvelopeStatus);

/**
 * Schema for envelope query parameters
 */
export const EnvelopeQuerySchema = z.object({
  status: EnvelopeStatusSchema.optional(),
  createdBy: z.string().optional(), // Changed from ownerId to createdBy to match Prisma schema
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.nativeEnum(EnvelopeSortBy).default(EnvelopeSortBy.CREATED_AT),
  sortOrder: z.nativeEnum(SortOrder).default(SortOrder.DESC)
});

/**
 * Type inference from schemas
 */
export type CreateEnvelopeWithSignersRequest = z.infer<typeof CreateEnvelopeWithSignersSchema>;
export type CreateEnvelopeRequest = z.infer<typeof CreateEnvelopeSchema>;
export type UpdateEnvelopeRequest = z.infer<typeof UpdateEnvelopeSchema>;
export type EnvelopeIdParams = z.infer<typeof EnvelopeIdSchema>;
export type EnvelopeQuery = z.infer<typeof EnvelopeQuerySchema>;
