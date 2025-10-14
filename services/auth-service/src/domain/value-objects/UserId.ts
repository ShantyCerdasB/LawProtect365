/**
 * @fileoverview UserId value object - Represents a unique user identifier
 * @summary Encapsulates user ID validation and equality logic
 * @description The UserId value object ensures user identifiers are valid UUIDs
 * and provides type safety for user identification throughout the system.
 */

import { Identifier, uuid, isUuidV4 } from '@lawprotect/shared-ts';
import { userNotFound } from '../../auth-errors';

/**
 * UserId value object
 * 
 * Represents a unique identifier for a user. Ensures the ID is a valid UUID
 * and provides type safety for user identification.
 */
export class UserId extends Identifier<string> {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw userNotFound('UserId must be a non-empty string');
    }

    if (!isUuidV4(value)) {
      throw userNotFound('UserId must be a valid UUID');
    }

    super(value);
  }

  /**
   * Creates a new UserId with a random UUID
   */
  static generate(): UserId {
    return new UserId(uuid());
  }

  /**
   * Creates a UserId from a string value
   */
  static fromString(value: string): UserId {
    return new UserId(value);
  }

  /**
   * Checks if this UserId equals another UserId
   */
  equals(other: UserId): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Returns the string representation of the user ID
   */
  toString(): string {
    return this.getValue();
  }

  /**
   * Returns the JSON representation of the user ID
   */
  toJSON(): string {
    return this.getValue();
  }
}
