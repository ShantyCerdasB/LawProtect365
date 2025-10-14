/**
 * @fileoverview ProviderAccountId - Value object for OAuth provider account IDs
 * @summary Represents a provider-specific account identifier
 * @description This value object encapsulates OAuth provider account identifiers
 * with validation and type safety for external provider integration.
 */

import { StringValueObject, BadRequestError, isNonEmptyString } from '@lawprotect/shared-ts';

/**
 * ProviderAccountId value object representing an OAuth provider account identifier
 * 
 * Encapsulates provider-specific account identifiers with validation.
 */
export class ProviderAccountId extends StringValueObject {
  constructor(value: string) {
    if (!isNonEmptyString(value)) {
      throw new BadRequestError('ProviderAccountId must be a non-empty string', 'INVALID_PROVIDER_ACCOUNT_ID');
    }
    super(value.trim());
  }

  /**
   * Creates a ProviderAccountId from a string value
   * @param value - The provider account ID string
   * @returns ProviderAccountId instance
   */
  static fromString(value: string): ProviderAccountId {
    return new ProviderAccountId(value);
  }

  /**
   * Creates a ProviderAccountId from a string or undefined
   * @param value - The provider account ID string or undefined
   * @returns ProviderAccountId instance or undefined
   */
  static fromStringOrUndefined(value: string | undefined): ProviderAccountId | undefined {
    return value ? new ProviderAccountId(value) : undefined;
  }

  /**
   * Checks if this provider account ID equals another
   * @param other - Other ProviderAccountId to compare
   * @returns True if they are equal
   */
  equals(other: ProviderAccountId): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Converts to JSON representation
   * @returns String representation
   */
  toJSON(): string {
    return this.getValue();
  }
}
