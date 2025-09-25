/**
 * @fileoverview CommonSchemas - Shared validation schemas
 * @summary Common validation schemas used across multiple domain schemas
 * @description Provides reusable validation schemas to avoid duplication
 */

import { z, EmailStringSchema, NonEmptyStringSchema } from '@lawprotect/shared-ts';

/**
 * Common signer data schema used in multiple contexts
 */
export const SignerDataSchema = z.object({
  email: EmailStringSchema,
  fullName: NonEmptyStringSchema.max(255, 'Full name must be less than 255 characters'),
  order: z.number().min(1, 'Order must be at least 1').optional(),
  isExternal: z.boolean(),
  userId: z.string().optional()
});

/**
 * Common metadata schema for envelopes
 */
export const EnvelopeMetadataSchema = z.object({
  title: NonEmptyStringSchema.max(255, 'Title must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  expiresAt: z.date().optional(),
  customFields: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  reminders: z.object({
    daysBeforeExpiration: z.number().min(1).max(365).optional(),
    firstReminderDays: z.number().min(1).max(30).optional(),
    secondReminderDays: z.number().min(1).max(30).optional()
  }).optional()
});

/**
 * Common template fields schema for envelopes
 */
export const EnvelopeTemplateFieldsSchema = z.object({
  templateId: z.string().optional(),
  templateVersion: z.string().optional()
});

/**
 * Common S3 pipeline keys schema for envelopes
 */
export const EnvelopeS3KeysSchema = z.object({
  sourceKey: z.string().optional(),
  metaKey: z.string().optional(),
  flattenedKey: z.string().optional(),
  signedKey: z.string().optional()
});

/**
 * Common content integrity hashes schema for envelopes
 */
export const EnvelopeContentHashesSchema = z.object({
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/i, 'Source hash must be a valid SHA-256 hash').optional(),
  flattenedSha256: z.string().regex(/^[a-f0-9]{64}$/i, 'Flattened hash must be a valid SHA-256 hash').optional(),
  signedSha256: z.string().regex(/^[a-f0-9]{64}$/i, 'Signed hash must be a valid SHA-256 hash').optional()
});

/**
 * Common lifecycle timestamps schema for envelopes
 */
export const EnvelopeLifecycleTimestampsSchema = z.object({
  sentAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  declinedAt: z.string().datetime().optional(),
  declinedBySignerId: z.string().uuid().optional(),
  declinedReason: z.string().optional(),
  expiresAt: z.string().datetime().optional()
});

/**
 * Common audit timestamps schema for envelopes
 */
export const EnvelopeAuditTimestampsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

/**
 * Combined common envelope fields schema
 * Contains all shared fields between GetEnvelope and UpdateEnvelope schemas
 */
export const EnvelopeCommonFieldsSchema = EnvelopeTemplateFieldsSchema
  .merge(EnvelopeS3KeysSchema)
  .merge(EnvelopeContentHashesSchema)
  .merge(EnvelopeLifecycleTimestampsSchema)
  .merge(EnvelopeAuditTimestampsSchema);

/**
 * Type inference from common schemas
 */
export type SignerData = z.infer<typeof SignerDataSchema>;
export type EnvelopeMetadata = z.infer<typeof EnvelopeMetadataSchema>;
export type EnvelopeTemplateFields = z.infer<typeof EnvelopeTemplateFieldsSchema>;
export type EnvelopeS3Keys = z.infer<typeof EnvelopeS3KeysSchema>;
export type EnvelopeContentHashes = z.infer<typeof EnvelopeContentHashesSchema>;
export type EnvelopeLifecycleTimestamps = z.infer<typeof EnvelopeLifecycleTimestampsSchema>;
export type EnvelopeAuditTimestamps = z.infer<typeof EnvelopeAuditTimestampsSchema>;
export type EnvelopeCommonFields = z.infer<typeof EnvelopeCommonFieldsSchema>;
