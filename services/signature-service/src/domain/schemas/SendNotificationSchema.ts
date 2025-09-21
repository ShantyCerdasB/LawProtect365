/**
 * @fileoverview SendNotificationSchema - Validation schemas for notification operations
 * @summary Zod schemas for validating notification request data
 * @description Provides validation schemas for sending notifications including
 * reminders and invitation resends with proper type safety and validation.
 */

import {z, UuidV4, NotificationType} from '@lawprotect/shared-ts';

/**
 * Schema for envelope ID in path parameters
 */
export const SendNotificationPathSchema = z.object({
  envelopeId: UuidV4
});

/**
 * Schema for sending notifications request body
 */
export const SendNotificationRequestSchema = z.object({
  type: z.nativeEnum(NotificationType, {
    errorMap: () => ({ message: 'Notification type must be either "reminder" or "resend"' })
  }),
  signerIds: z.array(UuidV4).optional().describe('Optional: specific signer IDs to notify'),
  message: z.string().max(500, 'Custom message must be less than 500 characters').optional().describe('Optional: custom message for the notification')
});

/**
 * Type inference for SendNotificationRequest
 */
export type SendNotificationRequest = z.infer<typeof SendNotificationRequestSchema>;
