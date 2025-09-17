/**
 * @fileoverview Time constants for common time periods
 * @summary Defines constants for common time periods in milliseconds
 * @description This module contains constants for common time periods
 * to avoid hardcoded calculations throughout the application.
 */

/**
 * Time period constants in milliseconds
 */
export const TIME_CONSTANTS = {
  /**
   * 1 second in milliseconds
   */
  SECOND_MS: 1_000,

  /**
   * 1 minute in milliseconds
   */
  MINUTE_MS: 60_000,

  /**
   * 1 hour in milliseconds
   */
  HOUR_MS: 3_600_000,

  /**
   * 1 day in milliseconds
   */
  DAY_MS: 86_400_000,

  /**
   * 1 week in milliseconds
   */
  WEEK_MS: 604_800_000,

  /**
   * 1 month in milliseconds (approximate - 30 days)
   */
  MONTH_MS: 2_592_000_000,

  /**
   * 1 year in milliseconds (approximate - 365 days)
   */
  YEAR_MS: 31_536_000_000
} as const;

/**
 * Common time periods for business logic
 */
export const BUSINESS_TIME_PERIODS = {
  /**
   * Maximum age for legal signature validity (7 days)
   */
  MAX_SIGNATURE_LEGAL_AGE_MS: TIME_CONSTANTS.WEEK_MS,

  /**
   * Maximum age for signature validation (24 hours)
   */
  MAX_SIGNATURE_VALIDATION_AGE_MS: TIME_CONSTANTS.DAY_MS,

  /**
   * Maximum age for consent validation (24 hours)
   */
  MAX_CONSENT_AGE_MS: TIME_CONSTANTS.DAY_MS,

  /**
   * Maximum age for invitation token (7 days)
   */
  MAX_INVITATION_TOKEN_AGE_MS: TIME_CONSTANTS.WEEK_MS,

  /**
   * Maximum age for audit retention (7 years)
   */
  MAX_AUDIT_RETENTION_AGE_MS: 7 * TIME_CONSTANTS.YEAR_MS
} as const;

/**
 * Default reminder intervals for envelope workflows
 */
export const REMINDER_INTERVALS = {
  /**
   * Default reminder intervals in hours
   */
  DEFAULT_INTERVALS_HOURS: [24, 48, 72] as const,

  /**
   * First reminder interval in hours
   */
  FIRST_REMINDER_HOURS: 24,

  /**
   * Second reminder interval in hours
   */
  SECOND_REMINDER_HOURS: 48,

  /**
   * Third reminder interval in hours
   */
  THIRD_REMINDER_HOURS: 72,

  /**
   * Minimum hours required before expiration
   */
  MIN_HOURS_BEFORE_EXPIRATION: 24
} as const;

/**
 * Event timing constants for workflow operations
 */
export const EVENT_TIMING = {
  /**
   * Minimum minutes between same event types to prevent spam
   */
  MIN_MINUTES_BETWEEN_EVENTS: 1,

  /**
   * Minimum seconds between same event types to prevent spam
   */
  MIN_SECONDS_BETWEEN_EVENTS: 60
} as const;

/**
 * Helper function to calculate time periods
 * @param value - The numeric value
 * @param unit - The time unit
 * @returns Time period in milliseconds
 */
export function calculateTimePeriod(value: number, unit: keyof typeof TIME_CONSTANTS): number {
  return value * TIME_CONSTANTS[unit];
}

/**
 * Helper function to check if a time period has expired
 * @param startTime - The start time
 * @param maxAgeMs - Maximum age in milliseconds
 * @param currentTime - Current time (defaults to now)
 * @returns True if the time period has expired
 */
export function isTimePeriodExpired(
  startTime: Date, 
  maxAgeMs: number, 
  currentTime: Date = new Date()
): boolean {
  const age = currentTime.getTime() - startTime.getTime();
  return age > maxAgeMs;
}
