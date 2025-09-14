/**
 * @fileoverview EnvelopeId value object - Represents a unique envelope identifier
 * @summary Encapsulates envelope ID validation and equality logic
 * @description The EnvelopeId value object ensures envelope identifiers are valid UUIDs
 * and provides type safety for envelope identification throughout the system.
 */

import { Identifier, uuid, isUuidV4 } from '@lawprotect/shared-ts';
import { envelopeNotFound } from '../../signature-errors';

/**
 * EnvelopeId value object
 * 
 * Represents a unique identifier for an envelope. Ensures the ID is a valid UUID
 * and provides type safety for envelope identification.
 */
export class EnvelopeId extends Identifier<string> {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw envelopeNotFound('EnvelopeId must be a non-empty string');
    }

    if (!isUuidV4(value)) {
      throw envelopeNotFound('EnvelopeId must be a valid UUID');
    }

    super(value);
  }

  /**
   * Creates a new EnvelopeId with a random UUID
   */
  static generate(): EnvelopeId {
    return new EnvelopeId(uuid());
  }

  /**
   * Creates an EnvelopeId from a string value
   */
  static fromString(value: string): EnvelopeId {
    return new EnvelopeId(value);
  }

  /**
   * Checks if this EnvelopeId equals another EnvelopeId
   */
  equals(other: EnvelopeId): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Returns the string representation of the envelope ID
   */
  toString(): string {
    return this.getValue();
  }

  /**
   * Returns the JSON representation of the envelope ID
   */
  toJSON(): string {
    return this.getValue();
  }
}
