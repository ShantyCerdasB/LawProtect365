/**
 * @fileoverview ContentType value object - Represents a validated MIME content type
 * @summary Encapsulates content type validation and equality logic
 * @description The ContentType value object ensures MIME content types are valid
 * and provides type safety for content type handling throughout the system.
 */

import { BadRequestError } from '../../errors/index.js';

/**
 * ContentType value object
 * 
 * Represents a validated MIME content type with proper format validation.
 * Ensures content types follow MIME type standards and are valid for use.
 */
export class ContentType {
  constructor(private readonly value: string) {
    if (!value || typeof value !== 'string') {
      throw new BadRequestError('ContentType must be a non-empty string', 'INVALID_CONTENT_TYPE');
    }

    const trimmedValue = value.trim();
    
    if (trimmedValue.length === 0) {
      throw new BadRequestError('ContentType cannot be empty', 'INVALID_CONTENT_TYPE');
    }

    if (!this.isValidMimeType(trimmedValue)) {
      throw new BadRequestError('ContentType must be a valid MIME type', 'INVALID_CONTENT_TYPE');
    }

    this.value = trimmedValue;
  }

  /**
   * Creates a ContentType from a string value
   * @param value - The content type string
   */
  static fromString(value: string): ContentType {
    return new ContentType(value);
  }

  /**
   * Gets the content type value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Gets the main type (e.g., 'application' from 'application/pdf')
   */
  getMainType(): string {
    const parts = this.value.split('/');
    return parts.length >= 1 ? parts[0] : '';
  }

  /**
   * Gets the subtype (e.g., 'pdf' from 'application/pdf')
   */
  getSubType(): string {
    const parts = this.value.split('/');
    return parts.length >= 2 ? parts[1] : '';
  }

  /**
   * Checks if this is a PDF content type
   */
  isPdf(): boolean {
    return this.value === 'application/pdf';
  }

  /**
   * Checks if this is an image content type
   */
  isImage(): boolean {
    return this.getMainType() === 'image';
  }

  /**
   * Checks if this is a text content type
   */
  isText(): boolean {
    return this.getMainType() === 'text';
  }

  /**
   * Checks if this is an application content type
   */
  isApplication(): boolean {
    return this.getMainType() === 'application';
  }

  /**
   * Validates MIME type format
   * @param value - The value to validate
   * @returns true if valid
   */
  private isValidMimeType(value: string): boolean {
    const mimeRegex = /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*(\s*;\s*[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*=[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*)*$/;
    return mimeRegex.test(value);
  }

  /**
   * Checks if this ContentType equals another ContentType
   * @param other - Other ContentType to compare
   * @returns true if content types are equal
   */
  equals(other: ContentType): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the string representation of the content type
   */
  toString(): string {
    return this.value;
  }

  /**
   * Returns the JSON representation of the content type
   */
  toJSON(): string {
    return this.value;
  }
}
