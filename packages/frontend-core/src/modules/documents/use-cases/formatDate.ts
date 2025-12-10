/**
 * @fileoverview Format Date - Use case for formatting dates according to format strings
 * @summary Utility function for formatting dates according to format patterns
 * @description
 * Provides a reusable, platform-agnostic function for formatting dates according to format patterns.
 * This is a pure function that can be used in both web and mobile applications.
 * 
 * Supports format strings with placeholders:
 * - MM: Month (01-12)
 * - DD: Day (01-31)
 * - YYYY: Year (4 digits)
 * - YY: Year (2 digits, last two digits of year)
 */

/**
 * @description Default date format string.
 */
export const DEFAULT_DATE_FORMAT = 'MM/DD/YYYY';

/**
 * @description Formats a date according to the specified format string.
 * @param date Date object to format
 * @param format Format string (e.g., 'MM/DD/YYYY'). Defaults to 'MM/DD/YYYY'
 * @returns Formatted date string
 * @description
 * Formats a date object according to the provided format string.
 * Replaces format placeholders with actual date values:
 * - MM → month (01-12, zero-padded)
 * - DD → day (01-31, zero-padded)
 * - YYYY → year (4 digits)
 * - YY → year (2 digits, last two digits)
 * 
 * Example:
 * - formatDate(new Date(2024, 0, 15), 'MM/DD/YYYY') → '01/15/2024'
 * - formatDate(new Date(2024, 0, 15), 'DD-MM-YYYY') → '15-01-2024'
 * - formatDate(new Date(2024, 0, 15), 'MM/DD/YY') → '01/15/24'
 */
export function formatDate(date: Date, format: string = DEFAULT_DATE_FORMAT): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();

  return format
    .replace('MM', month)
    .replace('DD', day)
    .replace('YYYY', year)
    .replace('YY', year.slice(-2));
}

