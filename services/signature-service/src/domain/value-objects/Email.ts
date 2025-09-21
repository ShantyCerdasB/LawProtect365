/**
 * @fileoverview Email value object - Represents a validated email address
 * @summary Encapsulates email validation and domain extraction logic
 * @description The Email value object ensures email addresses are valid and provides
 * domain extraction for business logic.
 */

import { StringValueObject, isEmail } from '@lawprotect/shared-ts';
import { signerEmailRequired } from '../../signature-errors';

/**
 * Email value object
 * 
 * Represents a validated email address with domain extraction.
 * Ensures email addresses are properly formatted and provides domain information
 * for business logic and validation.
 */
export class Email extends StringValueObject {
  private readonly domain: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw signerEmailRequired('Email must be a non-empty string');
    }

    const trimmedValue = value.trim().toLowerCase();
    
    if (!isEmail(trimmedValue)) {
      throw signerEmailRequired('Email must be a valid email address');
    }

    super(trimmedValue);
    this.domain = this.extractDomain(trimmedValue);
  }

  /**
   * Creates an Email from a string value
   */
  static fromString(value: string): Email {
    return new Email(value);
  }

  /**
   * Creates an Email from a string value or returns undefined if null/undefined
   * @param value - The email string or null/undefined
   * @returns Email instance or undefined
   */
  static fromStringOrUndefined(value: string | null | undefined): Email | undefined {
    return value ? new Email(value) : undefined;
  }

  /**
   * Gets the domain part of the email
   */
  getDomain(): string {
    return this.domain;
  }


  /**
   * Extracts domain from email address
   */
  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : '';
  }

}
