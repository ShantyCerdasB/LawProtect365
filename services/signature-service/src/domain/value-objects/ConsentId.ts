/**
 * @fileoverview ConsentId value object - Represents a unique consent identifier
 * @summary Encapsulates consent ID validation and equality logic
 * @description The ConsentId value object ensures consent identifiers are valid UUIDs
 * and provides type safety for consent identification throughout the system.
 */

import { Identifier, uuid, isUuidV4 } from '@lawprotect/shared-ts';
import { consentRequired } from '../../signature-errors';

/**
 * ConsentId value object
 * 
 * Represents a unique identifier for a consent. Ensures the ID is a valid UUID
 * and provides type safety for consent identification.
 */
export class ConsentId extends Identifier<string> {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw consentRequired('ConsentId must be a non-empty string');
    }

    if (!isUuidV4(value)) {
      throw consentRequired('ConsentId must be a valid UUID');
    }

    super(value);
  }

  /**
   * Creates a new ConsentId with a random UUID
   */
  static generate(): ConsentId {
    return new ConsentId(uuid());
  }

  /**
   * Creates a ConsentId from a string value
   */
  static fromString(value: string): ConsentId {
    return new ConsentId(value);
  }

  /**
   * Creates a ConsentId from a string value or returns undefined if null/undefined
   * @param value - String value or null/undefined
   * @returns ConsentId instance or undefined
   */
  static fromStringOrUndefined(value: string | null | undefined): ConsentId | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    return new ConsentId(value);
  }

  /**
   * Checks if this ConsentId equals another ConsentId
   */
  equals(other: ConsentId): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Returns the string representation of the consent ID
   */
  toString(): string {
    return this.getValue();
  }

  /**
   * Returns the JSON representation of the consent ID
   */
  toJSON(): string {
    return this.getValue();
  }
}
