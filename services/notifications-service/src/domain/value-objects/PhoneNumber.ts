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
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }
}

