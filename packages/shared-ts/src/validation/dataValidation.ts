/**
 * @fileoverview Data validation utilities for common data validation tasks
 * @summary Utility functions for validating and converting data types
 * @description Provides reusable validation functions for numbers, dates, and other common data types
 * across microservices to ensure consistency and reduce code duplication.
 */

/**
 * Ensures a number is non-negative, defaulting to 0 if invalid
 * @param n - Number to validate
 * @param _field - Field name for error context (unused but kept for consistency)
 * @returns Valid non-negative number
 */
export function ensureNonNegative(n: number | undefined, _field: string): number {
  if (typeof n === 'number' && n >= 0) return n;
  // Invalid value for field, defaulting to 0
  return 0;
}

/**
 * Converts unknown value to Date
 * @param d - Value to convert
 * @returns Date instance
 */
export function toDate(d: unknown): Date {
  return d instanceof Date ? d : new Date(String(d));
}

/**
 * Converts unknown value to Date or undefined
 * Rejects invalid dates or dates that are too old (before year 2000)
 * @param d - Value to convert
 * @returns Date instance or undefined
 */
export function toDateOrUndefined(d: unknown): Date | undefined {
  if (d instanceof Date) return d;
  if (d) {
    const date = new Date(d as string | number);
    // Reject invalid dates or dates that are too old (before year 2000)
    if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
      return undefined;
    }
    return date;
  }
  return undefined;
}

/**
 * Converts unknown value to string or undefined
 * @param v - Value to convert
 * @returns String or undefined
 */
export function toStringOrUndefined(v: unknown): string | undefined {
  return typeof v === 'string' ? v : (v == null ? undefined : String(v));
}
