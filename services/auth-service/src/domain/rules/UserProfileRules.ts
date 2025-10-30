/**
 * @fileoverview UserProfileRules - Business rules for user profile validation
 * @summary Validation rules for user profile updates
 * @description Provides business rules for validating user profile data including
 * name validation, phone format, locale validation, and timezone validation.
 */

import { PatchMeRequest } from '../schemas/PatchMeSchema';
import { invalidUserData } from '../../auth-errors/factories';

/**
 * Business rules for user profile validation
 * 
 * Provides validation logic for user profile updates including:
 * - Name validation (length, format, control characters)
 * - Phone validation (E.164 format)
 * - Locale validation (BCP47 format)
 * - Timezone validation (IANA format)
 */
export class UserProfileRules {
  /**
   * Validates user profile update request
   * @param request - Profile update request
   * @throws invalidUserData if validation fails
   */
  static validateProfileUpdate(request: PatchMeRequest): void {
    // Validate name fields
    if (request.name !== undefined) {
      this.validateName(request.name);
    }
    
    if (request.givenName !== undefined) {
      this.validateName(request.givenName, 'givenName');
    }
    
    if (request.lastName !== undefined) {
      this.validateName(request.lastName, 'lastName');
    }
    
    // Validate personal info
    if (request.personalInfo) {
      this.validatePersonalInfo(request.personalInfo);
    }
  }

  /**
   * Validates name field
   * @param name - Name to validate
   * @param fieldName - Field name for error context
   * @throws invalidUserData if validation fails
   */
  private static validateName(name: string, fieldName: string = 'name'): void {
    // Check for control characters
    if (/[\x00-\x1F\x7F]/.test(name)) {
      throw invalidUserData({
        field: fieldName,
        value: name,
        message: 'Name cannot contain control characters'
      });
    }
    
    // Check for excessive whitespace
    if (name !== name.trim()) {
      throw invalidUserData({
        field: fieldName,
        value: name,
        message: 'Name cannot have leading or trailing whitespace'
      });
    }

    // Check length limits
    const maxLength = fieldName === 'name' ? 120 : 60;
    if (name.length > maxLength) {
      throw invalidUserData({
        field: fieldName,
        value: name,
        message: `${fieldName} cannot exceed ${maxLength} characters`
      });
    }
  }

  /**
   * Validates personal info fields
   * @param personalInfo - Personal info to validate
   * @throws invalidUserData if validation fails
   */
  private static validatePersonalInfo(personalInfo: {
    phone?: string;
    locale?: string;
    timeZone?: string;
  }): void {
    if (personalInfo.phone !== undefined) {
      this.validatePhone(personalInfo.phone);
    }
    
    if (personalInfo.locale !== undefined) {
      this.validateLocale(personalInfo.locale);
    }
    
    if (personalInfo.timeZone !== undefined) {
      this.validateTimeZone(personalInfo.timeZone);
    }
  }

  /**
   * Validates phone number in E.164 format
   * @param phone - Phone number to validate
   * @throws invalidUserData if validation fails
   */
  private static validatePhone(phone: string): void {
    if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
      throw invalidUserData({
        field: 'phone',
        value: phone,
        message: 'Phone must be in E.164 format (e.g., +1234567890)'
      });
    }
  }

  /**
   * Validates locale in BCP47 format
   * @param locale - Locale to validate
   * @throws invalidUserData if validation fails
   */
  private static validateLocale(locale: string): void {
    if (!/^[a-z]{2}-[A-Z]{2}$/.test(locale)) {
      throw invalidUserData({
        field: 'locale',
        value: locale,
        message: 'Locale must be in BCP47 format (e.g., es-CR, en-US)'
      });
    }
  }

  /**
   * Validates timezone in IANA format
   * @param timeZone - Timezone to validate
   * @throws invalidUserData if validation fails
   */
  private static validateTimeZone(timeZone: string): void {
    if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(timeZone)) {
      throw invalidUserData({
        field: 'timeZone',
        value: timeZone,
        message: 'TimeZone must be in IANA format (e.g., America/Costa_Rica)'
      });
    }
  }

  /**
   * Sanitizes string by removing control characters and normalizing whitespace
   * @param input - String to sanitize
   * @returns Sanitized string
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove only real control characters
      .replace(/\u200B/g, '') // Remove zero-width space
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}
