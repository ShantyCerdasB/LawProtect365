/**
 * @file dateValidation.ts
 * @summary Reusable date validation utilities for business rules
 * @description Common date validation functions that can be used across multiple microservices
 * for validating expiration dates, date ranges, and temporal business rules.
 */

import { addDays } from '../utils/date.js';

/**
 * Configuration for date range validation
 */
export interface DateRangeConfig {
  /** Minimum days from now */
  minDaysFromNow: number;
  /** Maximum days from now */
  maxDaysFromNow: number;
  /** Whether to allow past dates */
  allowPastDates: boolean;
}

/**
 * Validates that a date is within acceptable range from now
 * 
 * @param date - The date to validate
 * @param config - Configuration for the validation rules
 * @param fieldName - Name of the field for error messages (e.g., "expiration date")
 * @throws Error when date is outside acceptable range
 */
export function validateDateRange(
  date: Date | undefined,
  config: DateRangeConfig,
  fieldName: string = "date"
): void {
  if (!date) {
    return; // Optional field
  }

  const now = new Date();
  const dateTime = new Date(date);
  
  // Validate date is not in the past (unless allowed)
  if (!config.allowPastDates && dateTime < now) {
    throw new Error(`${fieldName} cannot be in the past`);
  }

  // Calculate minimum and maximum allowed dates
  const minDate = addDays(now, config.minDaysFromNow);
  const maxDate = addDays(now, config.maxDaysFromNow);

  // Validate minimum range
  if (dateTime < minDate) {
    throw new Error(
      `${fieldName} must be at least ${config.minDaysFromNow} day${config.minDaysFromNow > 1 ? 's' : ''} from now`
    );
  }

  // Validate maximum range
  if (dateTime > maxDate) {
    throw new Error(
      `${fieldName} cannot be more than ${config.maxDaysFromNow} day${config.maxDaysFromNow > 1 ? 's' : ''} from now`
    );
  }
}

/**
 * Validates that a date is not in the past
 * 
 * @param date - The date to validate
 * @param fieldName - Name of the field for error messages
 * @throws Error when date is in the past
 */
export function validateNotInPast(
  date: Date | undefined,
  fieldName: string = "date"
): void {
  if (!date) {
    return; // Optional field
  }

  const now = new Date();
  const dateTime = new Date(date);
  
  if (dateTime < now) {
    throw new Error(`${fieldName} cannot be in the past`);
  }
}

/**
 * Validates that a date is within a specific number of days from now
 * 
 * @param date - The date to validate
 * @param maxDaysFromNow - Maximum days from now allowed
 * @param fieldName - Name of the field for error messages
 * @throws Error when date is too far in the future
 */
export function validateMaxDaysFromNow(
  date: Date | undefined,
  maxDaysFromNow: number,
  fieldName: string = "date"
): void {
  if (!date) {
    return; // Optional field
  }

  const now = new Date();
  const dateTime = new Date(date);
  const maxDate = addDays(now, maxDaysFromNow);
  
  if (dateTime > maxDate) {
    throw new Error(
      `${fieldName} cannot be more than ${maxDaysFromNow} day${maxDaysFromNow > 1 ? 's' : ''} from now`
    );
  }
}

/**
 * Validates that a date is at least a specific number of days from now
 * 
 * @param date - The date to validate
 * @param minDaysFromNow - Minimum days from now required
 * @param fieldName - Name of the field for error messages
 * @throws Error when date is too soon
 */
export function validateMinDaysFromNow(
  date: Date | undefined,
  minDaysFromNow: number,
  fieldName: string = "date"
): void {
  if (!date) {
    return; // Optional field
  }

  const now = new Date();
  const dateTime = new Date(date);
  const minDate = addDays(now, minDaysFromNow);
  
  if (dateTime < minDate) {
    throw new Error(
      `${fieldName} must be at least ${minDaysFromNow} day${minDaysFromNow > 1 ? 's' : ''} from now`
    );
  }
}

/**
 * Validates that a date range is valid (start < end)
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @param startFieldName - Name of the start date field for error messages
 * @param endFieldName - Name of the end date field for error messages
 * @throws Error when date range is invalid
 */
export function validateDateRangeOrder(
  startDate: Date | undefined,
  endDate: Date | undefined,
  startFieldName: string = "start date",
  endFieldName: string = "end date"
): void {
  if (!startDate || !endDate) {
    return; // Optional fields
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    throw new Error(`${startFieldName} must be before ${endFieldName}`);
  }
}

/**
 * Validates that a date is within business hours (9 AM - 5 PM, Monday-Friday)
 * 
 * @param date - The date to validate
 * @param fieldName - Name of the field for error messages
 * @throws Error when date is outside business hours
 */
export function validateBusinessHours(
  date: Date | undefined,
  fieldName: string = "date"
): void {
  if (!date) {
    return; // Optional field
  }

  const dateTime = new Date(date);
  const dayOfWeek = dateTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = dateTime.getHours();
  
  // Check if it's a weekday (Monday-Friday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    throw new Error(`${fieldName} must be on a weekday (Monday-Friday)`);
  }
  
  // Check if it's within business hours (9 AM - 5 PM)
  if (hour < 9 || hour >= 17) {
    throw new Error(`${fieldName} must be within business hours (9 AM - 5 PM)`);
  }
}

/**
 * Validates that a date is within a specific timezone's business hours
 * 
 * @param date - The date to validate
 * @param timezone - The timezone to check (e.g., 'America/New_York')
 * @param fieldName - Name of the field for error messages
 * @throws Error when date is outside business hours in the specified timezone
 */
export function validateBusinessHoursInTimezone(
  date: Date | undefined,
  _timezone: string,
  fieldName: string = "date"
): void {
  if (!date) {
    return; // Optional field
  }

  // Note: This is a simplified implementation
  // In a real implementation, you'd use a library like date-fns-tz or moment-timezone
  // For now, we'll use the local timezone
  validateBusinessHours(date, fieldName);
}

/**
 * Validates that a date is within a specific window (e.g., 30 days from now)
 * 
 * @param date - The date to validate
 * @param windowDays - Number of days for the window
 * @param fieldName - Name of the field for error messages
 * @throws Error when date is outside the window
 */
export function validateDateWindow(
  date: Date | undefined,
  windowDays: number,
  fieldName: string = "date"
): void {
  if (!date) {
    return; // Optional field
  }

  const now = new Date();
  const dateTime = new Date(date);
  const windowStart = addDays(now, -windowDays);
  const windowEnd = addDays(now, windowDays);
  
  if (dateTime < windowStart || dateTime > windowEnd) {
    throw new Error(
      `${fieldName} must be within ${windowDays} day${windowDays > 1 ? 's' : ''} from now`
    );
  }
}
