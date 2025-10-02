/**
 * @fileoverview Data validation utilities for common data validation tasks
 * @summary Utility functions for validating and converting data types
 * @description Provides reusable validation functions for numbers, dates, and other common data types
 * across microservices to ensure consistency and reduce code duplication.
 */

/**
 * Ensures a number is non-negative, throwing error if invalid
 * @param n - Number to validate
 * @param field - Field name for error context
 * @returns Valid non-negative number
 * @throws {Error} If n is not a number or is negative
 */
export function ensureNonNegative(n: number | undefined, field: string): number {
  if (typeof n === 'number' && n >= 0) return n;
  throw new Error(`Invalid value for ${field}: expected non-negative number, got ${n}`);
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
    if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) {
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
  if (typeof v === 'string') {
    return v;
  }
  if (v == null) {
    return undefined;
  }
  return JSON.stringify(v);
}

/**
 * Normalizes and truncates a string message to a maximum length
 * @param message - The message to normalize and truncate
 * @param maxLength - Maximum allowed length (default: 1024)
 * @returns Normalized string or null if empty/undefined
 */
export function normalizeMessage(message: string | undefined, maxLength: number = 1024): string | null {
  if (message === undefined) return null;
  
  const trimmed = message.trim();
  if (trimmed.length === 0) return null;
  
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
}