/**
 * @fileoverview DefaultValues - Default values constants for notification processing
 * @summary Centralized default values to avoid hardcoded strings
 * @description Provides default values for common fields used across notification strategies
 * to ensure consistency and maintainability.
 */

/**
 * Default language code for notifications
 */
export const DEFAULT_LANGUAGE = 'en' as const;

/**
 * Default document title when envelope title is not provided
 */
export const DEFAULT_DOCUMENT_TITLE = 'Document' as const;

/**
 * Default user name when first name is not provided
 */
export const DEFAULT_USER_NAME = 'User' as const;

/**
 * Default value for unknown or missing data
 */
export const DEFAULT_UNKNOWN_VALUE = 'N/A' as const;

/**
 * Default reminder count when not specified
 */
export const DEFAULT_REMINDER_COUNT = 1 as const;

/**
 * Default subject for generic account notifications
 */
export const DEFAULT_ACCOUNT_NOTIFICATION_SUBJECT = 'Account Notification' as const;

/**
 * Default event type when event type cannot be determined
 */
export const DEFAULT_EVENT_TYPE = 'unknown' as const;

/**
 * Default notification subject when not provided
 */
export const DEFAULT_NOTIFICATION_SUBJECT = 'Notification' as const;

/**
 * Default service name for template lookup
 */
export const DEFAULT_SERVICE_NAME = 'signature-service' as const;

/**
 * Maximum retry attempts for notifications
 */
export const DEFAULT_MAX_RETRIES = 3 as const;

