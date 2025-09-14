/**
 * @fileoverview SignatureId value object - Represents a unique signature identifier
 * @summary Encapsulates signature ID validation and equality logic
 * @description The SignatureId value object ensures signature identifiers are valid UUIDs
 * and provides type safety for signature identification throughout the system.
 */

import { Identifier, uuid, isUuidV4 } from '@lawprotect/shared-ts';
import { signatureNotFound } from '../../signature-errors';

/**
 * SignatureId value object
 * 
 * Represents a unique identifier for a signature. Ensures the ID is a valid UUID
 * and provides type safety for signature identification.
 */
export class SignatureId extends Identifier<string> {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw signatureNotFound('SignatureId must be a non-empty string');
    }

    if (!isUuidV4(value)) {
      throw signatureNotFound('SignatureId must be a valid UUID');
    }

    super(value);
  }

  /**
   * Creates a new SignatureId with a random UUID
   */
  static generate(): SignatureId {
    return new SignatureId(uuid());
  }

  /**
   * Creates a SignatureId from a string value
   */
  static fromString(value: string): SignatureId {
    return new SignatureId(value);
  }

  /**
   * Checks if this SignatureId equals another SignatureId
   */
  equals(other: SignatureId): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Returns the string representation of the signature ID
   */
  toString(): string {
    return this.getValue();
  }

  /**
   * Returns the JSON representation of the signature ID
   */
  toJSON(): string {
    return this.getValue();
  }
}
