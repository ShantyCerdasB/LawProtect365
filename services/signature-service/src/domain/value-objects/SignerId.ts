/**
 * @fileoverview SignerId value object - Represents a unique signer identifier
 * @summary Encapsulates signer ID validation and equality logic
 * @description The SignerId value object ensures signer identifiers are valid UUIDs
 * and provides type safety for signer identification throughout the system.
 */

import { Identifier, uuid, isUuidV4 } from '@lawprotect/shared-ts';

/**
 * SignerId value object
 * 
 * Represents a unique identifier for a signer. Ensures the ID is a valid UUID
 * and provides type safety for signer identification.
 */
export class SignerId extends Identifier<string> {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new Error('SignerId must be a non-empty string');
    }

    if (!isUuidV4(value)) {
      throw new Error('SignerId must be a valid UUID');
    }

    super(value);
  }

  /**
   * Creates a new SignerId with a random UUID
   */
  static generate(): SignerId {
    return new SignerId(uuid());
  }

  /**
   * Creates a SignerId from a string value
   */
  static fromString(value: string): SignerId {
    return new SignerId(value);
  }

  /**
   * Checks if this SignerId equals another SignerId
   */
  equals(other: SignerId): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Returns the string representation of the signer ID
   */
  toString(): string {
    return this.getValue();
  }

  /**
   * Returns the JSON representation of the signer ID
   */
  toJSON(): string {
    return this.getValue();
  }
}
