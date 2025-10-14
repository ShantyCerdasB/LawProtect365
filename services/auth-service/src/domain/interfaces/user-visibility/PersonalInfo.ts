/**
 * @fileoverview PersonalInfo - Interface for user personal information
 * @summary Defines the structure for user personal information
 * @description This interface represents user personal information including
 * phone number, locale, and timezone preferences.
 */

/**
 * User personal information
 */
export interface PersonalInfo {
  /** User phone number */
  phone: string | null;
  /** User locale preference */
  locale: string | null;
  /** User timezone preference */
  timeZone: string | null;
}
