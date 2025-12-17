/**
 * @fileoverview SignatureServiceEventSchemas - Validation schemas for signature service events
 * @summary Provides specific Zod validation schemas for each signature service event type
 * @description This module defines validation schemas for signature service events to ensure
 * type safety and data validation before processing. Each schema validates the exact fields
 * required for its specific event type, providing early error detection and documentation.
 */

import { z, NonEmptyStringSchema } from '@lawprotect/shared-ts';

/**
 * Schema for ENVELOPE_INVITATION event payload
 * @description Validates that ENVELOPE_INVITATION events contain required fields:
 * - signerEmail: Valid email address of the signer
 * - message: Non-empty message for the invitation
 * - metadata.envelopeTitle: Optional document title
 */
export const EnvelopeInvitationEventSchema = z.object({
  signerEmail: z.string().email('signerEmail must be a valid email address'),
  message: NonEmptyStringSchema,
  metadata: z.object({
    envelopeTitle: z.string().optional(),
  }).optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
}).passthrough();

/**
 * Schema for DOCUMENT_VIEW_INVITATION event payload
 * @description Validates that DOCUMENT_VIEW_INVITATION events contain required fields:
 * - viewerEmail: Valid email address of the viewer
 * - message: Non-empty message for the invitation
 * - metadata.envelopeTitle: Optional document title
 */
export const DocumentViewInvitationEventSchema = z.object({
  viewerEmail: z.string().email('viewerEmail must be a valid email address'),
  message: NonEmptyStringSchema,
  metadata: z.object({
    envelopeTitle: z.string().optional(),
  }).optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
}).passthrough();

/**
 * Schema for SIGNER_DECLINED event payload
 * @description Validates that SIGNER_DECLINED events contain required fields:
 * - signerEmail: Email address of the signer who declined
 * - declineReason: Non-empty reason for declining
 * - metadata.envelopeTitle: Optional document title
 */
export const SignerDeclinedEventSchema = z.object({
  signerEmail: z.string().min(1, 'signerEmail is required'),
  declineReason: NonEmptyStringSchema,
  metadata: z.object({
    envelopeTitle: z.string().optional(),
  }).optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
}).passthrough();

/**
 * Schema for ENVELOPE_CANCELLED event payload
 * @description Validates that ENVELOPE_CANCELLED events contain:
 * - signerEmail: Optional email address (may be empty if no signer)
 * - envelopeTitle: Optional document title
 */
export const EnvelopeCancelledEventSchema = z.object({
  signerEmail: z.string().email().optional(),
  envelopeTitle: z.string().optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
}).passthrough();

/**
 * Schema for REMINDER_NOTIFICATION event payload
 * @description Validates that REMINDER_NOTIFICATION events contain required fields:
 * - message: Non-empty reminder message
 * - signerEmail: Optional email address (may be empty)
 * - reminderCount: Optional positive integer (defaults to 1)
 */
export const ReminderNotificationEventSchema = z.object({
  message: NonEmptyStringSchema,
  signerEmail: z.string().email().optional(),
  reminderCount: z.number().int().min(1, 'reminderCount must be at least 1').optional(),
  recipientLanguage: z.string().min(2).max(5).optional(),
  language: z.string().min(2).max(5).optional(),
}).passthrough();

/**
 * Type inference for signature service event schemas
 */
export type EnvelopeInvitationEventPayload = z.infer<typeof EnvelopeInvitationEventSchema>;
export type DocumentViewInvitationEventPayload = z.infer<typeof DocumentViewInvitationEventSchema>;
export type SignerDeclinedEventPayload = z.infer<typeof SignerDeclinedEventSchema>;
export type EnvelopeCancelledEventPayload = z.infer<typeof EnvelopeCancelledEventSchema>;
export type ReminderNotificationEventPayload = z.infer<typeof ReminderNotificationEventSchema>;

