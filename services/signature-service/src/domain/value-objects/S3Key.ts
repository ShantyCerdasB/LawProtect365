/**
 * @fileoverview S3Key value object - Represents an S3 object key
 * @summary Encapsulates S3 key validation and formatting logic
 * @description The S3Key value object ensures S3 keys are properly formatted
 * and provides utilities for S3 key manipulation and validation.
 */

import { BadRequestError } from '@lawprotect/shared-ts';

/**
 * S3Key value object
 * 
 * Represents an S3 object key with validation and formatting capabilities.
 * Ensures S3 keys follow proper naming conventions and are valid.
 */
export class S3Key {
  constructor(private readonly key: string) {
    if (!key || typeof key !== 'string') {
      throw new BadRequestError('S3Key must be a non-empty string', 'INVALID_S3_KEY');
    }

    const trimmedKey = key.trim();
    
    if (trimmedKey.length === 0) {
      throw new BadRequestError('S3Key cannot be empty', 'INVALID_S3_KEY');
    }

    if (trimmedKey.length > 1024) {
      throw new BadRequestError('S3Key must be less than 1024 characters', 'INVALID_S3_KEY');
    }

    // Validate S3 key format
    if (!this.isValidS3Key(trimmedKey)) {
      throw new BadRequestError('S3Key contains invalid characters', 'INVALID_S3_KEY');
    }

    this.key = trimmedKey;
  }

  /**
   * Creates an S3Key from a string value
   * @param key - The S3 key string
   */
  static fromString(key: string): S3Key {
    return new S3Key(key);
  }

  /**
   * Gets the S3 key value
   */
  getValue(): string {
    return this.key;
  }

  /**
   * Gets the key without the file extension
   */
  getBaseName(): string {
    const lastDotIndex = this.key.lastIndexOf('.');
    return lastDotIndex > 0 ? this.key.substring(0, lastDotIndex) : this.key;
  }

  /**
   * Gets the file extension
   */
  getExtension(): string {
    const lastDotIndex = this.key.lastIndexOf('.');
    return lastDotIndex > 0 ? this.key.substring(lastDotIndex + 1) : '';
  }

  /**
   * Gets the directory path
   */
  getDirectory(): string {
    const lastSlashIndex = this.key.lastIndexOf('/');
    return lastSlashIndex > 0 ? this.key.substring(0, lastSlashIndex) : '';
  }

  /**
   * Gets the filename
   */
  getFileName(): string {
    const lastSlashIndex = this.key.lastIndexOf('/');
    return lastSlashIndex > 0 ? this.key.substring(lastSlashIndex + 1) : this.key;
  }

  /**
   * Checks if the key has a specific extension
   * @param extension - The extension to check (without dot)
   */
  hasExtension(extension: string): boolean {
    return this.getExtension().toLowerCase() === extension.toLowerCase();
  }

  /**
   * Checks if the key is a PDF file
   */
  isPdf(): boolean {
    return this.hasExtension('pdf');
  }

  /**
   * Checks if the key is an image file
   */
  isImage(): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageExtensions.includes(this.getExtension().toLowerCase());
  }

  /**
   * Validates S3 key format
   * @param key - The key to validate
   * @returns true if valid
   */
  private isValidS3Key(key: string): boolean {
    // S3 key cannot start with /
    if (key.startsWith('/')) {
      return false;
    }

    // S3 key cannot contain consecutive slashes
    if (key.includes('//')) {
      return false;
    }

    // S3 key cannot contain certain characters
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(key)) {
      return false;
    }

    return true;
  }

  /**
   * Checks if this S3Key equals another S3Key
   * @param other - Other S3Key to compare
   * @returns true if keys are equal
   */
  equals(other: S3Key): boolean {
    return this.key === other.key;
  }

  /**
   * Returns the string representation of the S3 key
   */
  toString(): string {
    return this.key;
  }

  /**
   * Returns the JSON representation of the S3 key
   */
  toJSON(): string {
    return this.key;
  }
}
