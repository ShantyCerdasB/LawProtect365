/**
 * @fileoverview ReminderTrackingId - Value object for reminder tracking identifiers
 * @summary UUID-based identifier for reminder tracking records
 * @description Provides type-safe identification for reminder tracking entities
 * with validation and generation capabilities.
 */

import { z } from 'zod';

/**
 * Schema for validating reminder tracking ID format
 */
const ReminderTrackingIdSchema = z.string().uuid('ReminderTrackingId must be a valid UUID');

/**
 * ReminderTrackingId value object
 * 
 * Represents a unique identifier for reminder tracking records.
 * Ensures type safety and validation for reminder tracking operations.
 */
export class ReminderTrackingId {
  private constructor(private readonly _value: string) {}

  /**
   * Creates a ReminderTrackingId from a string
   * @param value - The UUID string value
   * @returns ReminderTrackingId instance
   * @throws Error if value is not a valid UUID
   */
  static fromString(value: string): ReminderTrackingId {
    const result = ReminderTrackingIdSchema.safeParse(value);
    if (!result.success) {
      throw new Error(`Invalid ReminderTrackingId: ${result.error.errors[0]?.message || 'Invalid UUID format'}`);
    }
    return new ReminderTrackingId(result.data);
  }

  /**
   * Generates a new ReminderTrackingId
   * @returns New ReminderTrackingId instance
   */
  static generate(): ReminderTrackingId {
    const { randomUUID } = require('crypto');
    return new ReminderTrackingId(randomUUID());
  }

  /**
   * Gets the string value
   * @returns The UUID string value
   */
  getValue(): string {
    return this._value;
  }

  /**
   * Checks equality with another ReminderTrackingId
   * @param other - The other ReminderTrackingId to compare
   * @returns True if equal
   */
  equals(other: ReminderTrackingId): boolean {
    return this._value === other._value;
  }

  /**
   * String representation
   * @returns The UUID string value
   */
  toString(): string {
    return this._value;
  }
}
