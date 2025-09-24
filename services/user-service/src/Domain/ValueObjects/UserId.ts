/**
 * @fileoverview UserId - User identifier value object
 * @summary Unique identifier for a user
 * @description Represents a user's unique identifier with UUID v4 validation.
 */

import { StringValueObject } from "@lawprotect/shared-ts";
import { validationFailed } from "@/UserServiceErrors";

/**
 * User ID value object
 * 
 * Represents a user's unique identifier with UUID v4 validation.
 * Provides normalization and validation for user IDs.
 * 
 * @example
 * ```ts
 * const userId = UserId.create("550e8400-e29b-41d4-a716-446655440000");
 * console.log(userId.getValue()); // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export class UserId extends StringValueObject {
  private static readonly UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /**
   * Creates a new UserId from a string value
   * @param value - The UUID string to validate and normalize
   * @returns A new UserId instance
   * @throws validationFailed when the value is not a valid UUID v4
   */
  static create(value: string): UserId {
    if (!value || typeof value !== 'string') {
      throw validationFailed("User ID is required and must be a string", {
        providedValue: value,
        expectedFormat: "UUID v4"
      });
    }

    const normalizedValue = value.toLowerCase().trim();
    
    if (!UserId.UUID_V4_REGEX.test(normalizedValue)) {
      throw validationFailed("Invalid UUID v4 format for User ID", {
        providedValue: value,
        expectedFormat: "UUID v4 (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)"
      });
    }

    return new UserId(normalizedValue);
  }

  /**
   * Private constructor - use static factory methods instead
   * @param value - The validated UUID string
   */
  private constructor(value: string) {
    super(value);
  }
}
