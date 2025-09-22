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
  title: NonEmptyStringSchema.max(255, 'Title must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  signingOrderType: z.nativeEnum(SigningOrderType),
  originType: z.nativeEnum(DocumentOriginType),
  templateId: z.string().optional(),
  templateVersion: z.string().optional(),
  expiresAt: z.date().optional(),
  sourceKey: z.string().min(1, 'Source key is required'),
  metaKey: z.string().min(1, 'Meta key is required'),
  signers: z.array(SignerDataSchema).optional()
});

/**
 * Schema for creating a new envelope (without signers)
 */
export const CreateEnvelopeSchema = z.object({
  title: NonEmptyStringSchema.max(255, 'Title must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  signingOrderType: z.nativeEnum(SigningOrderType).default(SigningOrderType.OWNER_FIRST).optional(),
  originType: z.nativeEnum(DocumentOriginType),
  templateId: z.string().optional(),
  templateVersion: z.string().optional(),
  expiresAt: z.date().optional(),
  sourceKey: z.string().min(1, 'Source key is required'),
  metaKey: z.string().min(1, 'Meta key is required')
  // Note: signers are not created in CreateEnvelope flow
  // They are added separately via UpdateEnvelope flow
}).refine((data) => {
  // Validate template fields when originType is TEMPLATE
  if (data.originType === DocumentOriginType.TEMPLATE) {
    return data.templateId && data.templateVersion;
  }
  return true;
}, {
  message: 'templateId and templateVersion are required when originType is TEMPLATE',
  path: ['templateId', 'templateVersion']
});

/**
 * Schema for updating an envelope
 */
export const UpdateEnvelopeSchema = z.object({
  // Metadata básica
  title: NonEmptyStringSchema.max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  expiresAt: z.date().optional(),
  
  // Signing order
  signingOrderType: z.nativeEnum(SigningOrderType).optional(),
  
  // S3 keys (format validation handled by S3Key value object)
  sourceKey: z.string().optional(),
  metaKey: z.string().optional(),
  
  // Signers
  addSigners: z.array(SignerDataSchema).optional(),
  removeSignerIds: z.array(UuidV4).optional(),
  
  // Legacy fields (keep for backward compatibility)
  customFields: JsonObjectSchema.optional(),
  tags: z.array(z.string()).optional(),
  reminders: z.object({
    daysBeforeExpiration: z.number().min(1).max(365).optional(),
    firstReminderDays: z.number().min(1).max(30).optional(),
    secondReminderDays: z.number().min(1).max(30).optional()
  }).optional()
}).strict(); // Reject unrecognized fields (immutable fields)

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
  createdBy: z.string().optional(),
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
