/**
 * @fileoverview Notification Error Factories - Convenience constructors for notifications service errors
 * @summary Error factory functions for consistent error handling
 * @description Provides helper functions for creating consistent error instances with 
 * appropriate status codes, error codes, and messages for the notifications service domain.
 */

import { 
  BadRequestError,
  ConflictError,
  InternalError,
  NotFoundError,
  UnprocessableEntityError
} from "@lawprotect/shared-ts";
import { NotificationErrorCodes } from "./codes";

// ============================================================================
// NOTIFICATION ERRORS
// ============================================================================

/**
 * Creates a NotFoundError for when a notification was not found (404).
 */
export const notificationNotFound = (details?: unknown) =>
  new NotFoundError("Notification not found", NotificationErrorCodes.NOTIFICATION_NOT_FOUND, details);

/**
 * Creates a ConflictError for when a notification already exists (409).
 */
export const notificationAlreadyExists = (details?: unknown) =>
  new ConflictError("Notification already exists", NotificationErrorCodes.NOTIFICATION_ALREADY_EXISTS, details);

/**
 * Creates an UnprocessableEntityError for invalid notification state (422).
 */
export const notificationInvalidState = (details?: unknown) =>
  new UnprocessableEntityError("Notification is in invalid state", NotificationErrorCodes.NOTIFICATION_INVALID_STATE, details);

/**
 * Creates an InternalError for notification creation failures (500).
 */
export const notificationCreationFailed = (details?: unknown) =>
  new InternalError("Notification creation failed", NotificationErrorCodes.NOTIFICATION_CREATION_FAILED, details);

/**
 * Creates an InternalError for notification update failures (500).
 */
export const notificationUpdateFailed = (details?: unknown) =>
  new InternalError("Notification update failed", NotificationErrorCodes.NOTIFICATION_UPDATE_FAILED, details);

// ============================================================================
// CHANNEL ERRORS
// ============================================================================

/**
 * Creates an InternalError for email send failures (500).
 */
export const emailSendFailed = (details?: unknown) =>
  new InternalError("Email send failed", NotificationErrorCodes.EMAIL_SEND_FAILED, details);

/**
 * Creates an InternalError for SMS send failures (500).
 */
export const smsSendFailed = (details?: unknown) =>
  new InternalError("SMS send failed", NotificationErrorCodes.SMS_SEND_FAILED, details);

/**
 * Creates an InternalError for push notification send failures (500).
 */
export const pushSendFailed = (details?: unknown) =>
  new InternalError("Push notification send failed", NotificationErrorCodes.PUSH_SEND_FAILED, details);

/**
 * Creates a BadRequestError for invalid channel (400).
 */
export const invalidChannel = (details?: unknown) =>
  new BadRequestError("Invalid notification channel", NotificationErrorCodes.INVALID_CHANNEL, details);

/**
 * Creates an UnprocessableEntityError for disabled channel (422).
 */
export const channelDisabled = (details?: unknown) =>
  new UnprocessableEntityError("Notification channel is disabled", NotificationErrorCodes.CHANNEL_DISABLED, details);

/**
 * Creates a BadRequestError for invalid recipient (400).
 */
export const invalidRecipient = (details?: unknown) =>
  new BadRequestError("Invalid recipient", NotificationErrorCodes.INVALID_RECIPIENT, details);

/**
 * Creates a BadRequestError for missing recipient (400).
 */
export const recipientRequired = (details?: unknown) =>
  new BadRequestError("Recipient is required", NotificationErrorCodes.RECIPIENT_REQUIRED, details);

// ============================================================================
// EVENT ERRORS
// ============================================================================

/**
 * Creates a BadRequestError for unknown event type (400).
 */
export const eventTypeUnknown = (details?: unknown) =>
  new BadRequestError("Unknown event type", NotificationErrorCodes.EVENT_TYPE_UNKNOWN, details);

/**
 * Creates a BadRequestError for event validation failures (400).
 */
export const eventValidationFailed = (details?: unknown) =>
  new BadRequestError("Event validation failed", NotificationErrorCodes.EVENT_VALIDATION_FAILED, details);

/**
 * Creates a ConflictError for already processed events (409).
 */
export const eventAlreadyProcessed = (details?: unknown) =>
  new ConflictError("Event already processed", NotificationErrorCodes.EVENT_ALREADY_PROCESSED, details);

// ============================================================================
// RETRY ERRORS
// ============================================================================

/**
 * Creates an UnprocessableEntityError for when max retries are exceeded (422).
 */
export const maxRetriesExceeded = (details?: unknown) =>
  new UnprocessableEntityError("Max retries exceeded", NotificationErrorCodes.MAX_RETRIES_EXCEEDED, details);

/**
 * Creates an InternalError for retry failures (500).
 */
export const retryFailed = (details?: unknown) =>
  new InternalError("Retry failed", NotificationErrorCodes.RETRY_FAILED, details);

// ============================================================================
// TEMPLATE ERRORS
// ============================================================================

/**
 * Creates an InternalError for template render failures (500).
 */
export const templateRenderFailed = (details?: unknown) =>
  new InternalError("Template render failed", NotificationErrorCodes.TEMPLATE_RENDER_FAILED, details);

// ============================================================================
// ENTITY ERRORS
// ============================================================================

/**
 * Creates a BadRequestError for invalid entity type (400).
 */
export const invalidEntity = (details?: unknown) =>
  new BadRequestError("Invalid entity type", NotificationErrorCodes.INVALID_ENTITY, details);

// ============================================================================
// EVENT VALIDATION ERRORS
// ============================================================================

/**
 * Creates a BadRequestError for malformed events (400).
 */
export const eventMalformed = (details?: unknown) =>
  new BadRequestError("Event is malformed", NotificationErrorCodes.EVENT_MALFORMED, details);

