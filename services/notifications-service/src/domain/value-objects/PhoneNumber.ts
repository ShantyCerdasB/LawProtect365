/**
 * @fileoverview PhoneNumber value object - Represents a validated phone number
 * @summary Encapsulates phone number validation and formatting logic
 * @description The PhoneNumber value object ensures phone numbers are valid
 * and provides normalization for SMS operations.
 */

import { StringValueObject } from '@lawprotect/shared-ts';
import { invalidRecipient } from '../../notification-errors';

/**
 * PhoneNumber value object
 * 
 * Represents a validated phone number for SMS operations.
 * Ensures phone numbers are properly formatted according to E.164 standard.
 */
export class PhoneNumber extends StringValueObject {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw invalidRecipient('Phone number must be a non-empty string');
    }

    const normalized = PhoneNumber.normalize(value);
    
    if (!PhoneNumber.isValid(normalized)) {
      throw invalidRecipient(`Invalid phone number: ${value}`);
    }

    super(normalized);
  }

  /**
   * @description Creates a PhoneNumber from a string value
   * @param {string} value - The phone number string to convert
   * @returns {PhoneNumber} A new PhoneNumber instance
   */
  static fromString(value: string): PhoneNumber {
    return new PhoneNumber(value);
  }

  /**
   * @description Creates a PhoneNumber from a string value or returns undefined if null/undefined
   * @param {string | null | undefined} value - String value or null/undefined
   * @returns {PhoneNumber | undefined} PhoneNumber instance or undefined
   */
  static fromStringOrUndefined(value: string | null | undefined): PhoneNumber | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    return new PhoneNumber(value);
  }

  /**
   * @description Normalizes phone number by removing formatting characters
   * @param {string} phoneNumber - Phone number to normalize
   * @returns {string} Normalized phone number
   */
  static normalize(phoneNumber: string): string {
    return phoneNumber.replace(/[\s\-\(\)]/g, '');
  }

  /**
   * @description Validates if a string is a valid phone number (E.164 format)
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if valid format, false otherwise
   */
  static isValid(phoneNumber: string): boolean {
    // E.164 format: must start with +, then 1-14 digits total (country code + number)
    // Must start with 1-9 (not 0) and be between 7-14 digits total
    if (!phoneNumber.startsWith('+')) {
      return false;
    }
    const digitsOnly = phoneNumber.replace(/\+/, '');
    // E.164 allows 1-14 digits total (excluding the +) - practical limit
    if (digitsOnly.length < 7 || digitsOnly.length > 14) {
      return false;
    }
    // Must start with 1-9 (not 0) - first digit after +
    const phoneRegex = /^\+[1-9]\d{6,13}$/;
    return phoneRegex.test(phoneNumber);
  }
}

