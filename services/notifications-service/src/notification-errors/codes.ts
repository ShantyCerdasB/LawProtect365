/**
 * @fileoverview Notification Error Codes - Domain-specific error codes for notifications service
 * @summary Error codes for notifications service domain operations
 * @description These codes complement the shared ErrorCodes catalog. Use them to keep
 * domain failures stable and machine-readable across logs, metrics and clients.
 */

import type { ErrorCode as SharedErrorCode } from "@lawprotect/shared-ts";

/**
 * Canonical error codes for the notifications domain.
 *
 * Keep codes stable once released; treat them as part of the public contract.
 */
export const NotificationErrorCodes = {
  NOTIFICATION_NOT_FOUND: "NOTIFICATION_NOT_FOUND",
  NOTIFICATION_ALREADY_EXISTS: "NOTIFICATION_ALREADY_EXISTS",
  NOTIFICATION_INVALID_STATE: "NOTIFICATION_INVALID_STATE",
  NOTIFICATION_CREATION_FAILED: "NOTIFICATION_CREATION_FAILED",
  NOTIFICATION_UPDATE_FAILED: "NOTIFICATION_UPDATE_FAILED",
  NOTIFICATION_DELETE_FAILED: "NOTIFICATION_DELETE_FAILED",
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",
  SMS_SEND_FAILED: "SMS_SEND_FAILED",
  PUSH_SEND_FAILED: "PUSH_SEND_FAILED",
  INVALID_CHANNEL: "INVALID_CHANNEL",
  CHANNEL_DISABLED: "CHANNEL_DISABLED",
  INVALID_RECIPIENT: "INVALID_RECIPIENT",
  RECIPIENT_REQUIRED: "RECIPIENT_REQUIRED",
  RECIPIENT_TYPE_MISMATCH: "RECIPIENT_TYPE_MISMATCH",
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  TEMPLATE_INVALID: "TEMPLATE_INVALID",
  TEMPLATE_RENDER_FAILED: "TEMPLATE_RENDER_FAILED",
  EVENT_TYPE_UNKNOWN: "EVENT_TYPE_UNKNOWN",
  EVENT_VALIDATION_FAILED: "EVENT_VALIDATION_FAILED",
  EVENT_ALREADY_PROCESSED: "EVENT_ALREADY_PROCESSED",
  MAX_RETRIES_EXCEEDED: "MAX_RETRIES_EXCEEDED",
  RETRY_FAILED: "RETRY_FAILED",
  INVALID_ENTITY: "INVALID_ENTITY",
  EVENT_MALFORMED: "EVENT_MALFORMED",
} as const;

/** Union of notifications-service specific code strings. */
export type NotificationErrorCode = keyof typeof NotificationErrorCodes;

/**
 * Union of any error code this service can emit:
 * - Shared catalog from @lawprotect/shared-ts
 * - Notifications-service specific codes above
 */
export type AnyErrorCode = SharedErrorCode | NotificationErrorCode;

