/**
 * @fileoverview DocumentHash value object - Represents a document hash
 * @summary Encapsulates document hash validation and formatting logic
 * @description The DocumentHash value object ensures document hashes are properly formatted
 * and provides utilities for hash validation and comparison.
 */

import { BadRequestError } from '@lawprotect/shared-ts';

/**
 * DocumentHash value object
 * 
 * Represents a document hash with validation and formatting capabilities.
 * Ensures hashes follow proper format and are valid for cryptographic operations.
 */
export class DocumentHash {
  constructor(private readonly hash: string) {
    if (!hash || typeof hash !== 'string') {
      throw new BadRequestError('DocumentHash must be a non-empty string', 'INVALID_DOCUMENT_HASH');
    }

    const trimmedHash = hash.trim().toLowerCase();
    
    if (trimmedHash.length === 0) {
      throw new BadRequestError('DocumentHash cannot be empty', 'INVALID_DOCUMENT_HASH');
    }

    // Validate hash format (SHA-256 should be 64 hex characters)
    if (!this.isValidHash(trimmedHash)) {
      throw new BadRequestError('DocumentHash must be a valid SHA-256 hash (64 hex characters)', 'INVALID_DOCUMENT_HASH');
    }

    this.hash = trimmedHash;
  }

  /**
   * Creates a DocumentHash from a string value
   * @param hash - The hash string
   */
  static fromString(hash: string): DocumentHash {
    return new DocumentHash(hash);
  }

  /**
   * Gets the hash value
   */
  getValue(): string {
    return this.hash;
  }

  /**
   * Gets the hash in uppercase
   */
  getUpperCase(): string {
    return this.hash.toUpperCase();
  }

  /**
   * Gets the hash in lowercase
   */
  getLowerCase(): string {
    return this.hash.toLowerCase();
  }

  /**
   * Gets the first 8 characters of the hash (short hash)
   */
  getShortHash(): string {
    return this.hash.substring(0, 8);
  }

  /**
   * Gets the last 8 characters of the hash
   */
  getLastChars(): string {
    return this.hash.substring(this.hash.length - 8);
  }

  /**
   * Checks if the hash matches a specific pattern
   * @param pattern - The pattern to match
   */
  matches(pattern: string): boolean {
    return this.hash.includes(pattern.toLowerCase());
  }

  /**
   * Checks if the hash starts with a specific prefix
   * @param prefix - The prefix to check
   */
  startsWith(prefix: string): boolean {
    return this.hash.startsWith(prefix.toLowerCase());
  }

  /**
   * Checks if the hash ends with a specific suffix
   * @param suffix - The suffix to check
   */
  endsWith(suffix: string): boolean {
    return this.hash.endsWith(suffix.toLowerCase());
  }

  /**
   * Validates hash format
   * @param hash - The hash to validate
   * @returns true if valid
   */
  private isValidHash(hash: string): boolean {
    // SHA-256 hash should be exactly 64 hex characters
    const sha256Regex = /^[a-f0-9]{64}$/;
    return sha256Regex.test(hash);
  }

  /**
   * Checks if this DocumentHash equals another DocumentHash
   * @param other - Other DocumentHash to compare
   * @returns true if hashes are equal
   */
  equals(other: DocumentHash): boolean {
    return this.hash === other.hash;
  }

  /**
   * Returns the string representation of the hash
   */
  toString(): string {
    return this.hash;
  }

  /**
   * Returns the JSON representation of the hash
   */
  toJSON(): string {
    return this.hash;
  }
}
