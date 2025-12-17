/**
 * @fileoverview EventBridgeEventSchema - Validation schemas for EventBridge events
 * @summary Provides Zod validation schemas for EventBridge events
 * @description This module defines validation schemas for EventBridge events to ensure
 * type safety and data validation before processing. It validates the standard EventBridge
 * event structure and event detail payloads.
 */

import { z, NonEmptyStringSchema, ISODateStringSchema } from '@lawprotect/shared-ts';

/**
 * Schema for validating EventBridge event structure
 * @description Validates the standard AWS EventBridge event format received by Lambda
 */
export const EventBridgeEventSchema = z.object({
  version: z.string().min(1, 'Version is required'),
  id: NonEmptyStringSchema,
  'detail-type': NonEmptyStringSchema,
  source: z.string().min(1, 'Source is required'),
  account: z.string().min(1, 'Account is required'),
  time: ISODateStringSchema,
  region: z.string().min(1, 'Region is required'),
  detail: z.record(z.string(), z.unknown()).refine((val) => Object.keys(val).length > 0, {
    message: 'Detail cannot be empty'
  }),
  resources: z.array(z.string()).optional(),
});

/**
 * Schema for validating event detail payload structure
 * @description Validates common fields in event detail payloads
 */
export const EventDetailSchema = z.object({
  userId: z.string().uuid().optional(),
  envelopeId: z.string().uuid().optional(),
  signerId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
  metadata: z.record(z.unknown()).optional(),
}).passthrough(); // Allow additional fields

/**
 * Schema for validating signature service event payloads
 * @description Validates common fields in signature service events
 */
export const SignatureServiceEventDetailSchema = EventDetailSchema.extend({
  signerEmail: z.string().email().optional(),
  viewerEmail: z.string().email().optional(),
  message: NonEmptyStringSchema.optional(),
  envelopeTitle: z.string().optional(),
  declineReason: z.string().optional(),
  reminderCount: z.number().int().min(1).optional(),
});

/**
 * Schema for validating auth service event payloads
 * @description Validates common fields in auth service events
 */
export const AuthServiceEventDetailSchema = EventDetailSchema.extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  oldRole: z.string().optional(),
  newRole: z.string().optional(),
  oldStatus: z.string().optional(),
  newStatus: z.string().optional(),
  mfaEnabled: z.boolean().optional(),
});

/**
 * Type inference for EventBridge events
 */
export type ValidatedEventBridgeEvent = z.infer<typeof EventBridgeEventSchema>;
export type ValidatedEventDetail = z.infer<typeof EventDetailSchema>;
export type ValidatedSignatureServiceEventDetail = z.infer<typeof SignatureServiceEventDetailSchema>;
export type ValidatedAuthServiceEventDetail = z.infer<typeof AuthServiceEventDetailSchema>;

