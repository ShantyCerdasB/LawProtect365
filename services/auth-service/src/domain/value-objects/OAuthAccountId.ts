/**
 * @fileoverview OAuthAccountId value object - Represents a unique OAuth account identifier
 * @summary Encapsulates OAuth account ID validation and equality logic
 * @description The OAuthAccountId value object ensures OAuth account identifiers are valid UUIDs
 * and provides type safety for OAuth account identification throughout the system.
 */

import { Identifier, uuid, isUuidV4 } from '@lawprotect/shared-ts';
import { userNotFound } from '../../auth-errors';

/**
 * OAuthAccountId value object
 * 
 * Represents a unique identifier for an OAuth account. Ensures the ID is a valid UUID
 * and provides type safety for OAuth account identification.
 */
export class OAuthAccountId extends Identifier<string> {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw userNotFound('OAuthAccountId must be a non-empty string');
    }

    if (!isUuidV4(value)) {
      throw userNotFound('OAuthAccountId must be a valid UUID');
    }

    super(value);
  }

  /**
   * Creates a new OAuthAccountId with a random UUID
   */
  static generate(): OAuthAccountId {
    return new OAuthAccountId(uuid());
  }

  /**
   * Creates an OAuthAccountId from a string value
   */
  static fromString(value: string): OAuthAccountId {
    return new OAuthAccountId(value);
  }

  /**
   * Checks if this OAuthAccountId equals another OAuthAccountId
   */
  equals(other: OAuthAccountId): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Returns the string representation of the OAuth account ID
   */
  toString(): string {
    return this.getValue();
  }

  /**
   * Returns the JSON representation of the OAuth account ID
   */
  toJSON(): string {
    return this.getValue();
  }
}
