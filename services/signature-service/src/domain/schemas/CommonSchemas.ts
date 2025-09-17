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
  order: z.number().min(1, 'Order must be at least 1')
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
 * Type inference from common schemas
 */
export type SignerData = z.infer<typeof SignerDataSchema>;
export type EnvelopeMetadata = z.infer<typeof EnvelopeMetadataSchema>;
