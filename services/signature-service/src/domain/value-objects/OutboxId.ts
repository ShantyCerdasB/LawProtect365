/**
 * @fileoverview OutboxId value object - Unique identifier for outbox records
 * @summary Value object for outbox record identifiers
 * @description The OutboxId value object represents a unique identifier
 * for outbox records, extending the base Identifier class for consistency.
 */

import { Identifier, BadRequestError, isUuidV4 } from '@lawprotect/shared-ts';

/**
 * OutboxId value object
 * 
 * Represents a unique identifier for outbox records, extending the base
 * Identifier class for consistency with other value objects.
 */
export class OutboxId extends Identifier<string> {
  constructor(value: string) {
    super(value);
    this.validate(value);
  }

  /**
   * Validates the outbox ID format
   * @param value - The value to validate
   * @throws {Error} If the value is not a valid UUID v4
   */
  private validate(value: string): void {
    if (!isUuidV4(value)) {
      throw new BadRequestError('OutboxId must be a valid UUID v4', 'INVALID_OUTBOX_ID');
    }
  }

  /**
   * Checks if this OutboxId equals another OutboxId
   */
  equals(other: OutboxId): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Returns the string representation of the outbox ID
   */
  toString(): string {
    return this.getValue();
  }

  /**
   * Returns the JSON representation of the outbox ID
   */
  toJSON(): string {
    return this.getValue();
  }
}
