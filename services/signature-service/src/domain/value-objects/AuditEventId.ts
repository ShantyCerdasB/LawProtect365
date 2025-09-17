/**
 * @fileoverview AuditEventId value object - Unique identifier for audit events
 * @summary Value object for audit event identifiers
 * @description The AuditEventId value object represents a unique identifier
 * for audit events, extending the base Identifier class for consistency.
 */

import { Identifier, BadRequestError } from '@lawprotect/shared-ts';
import { isUuidV4 } from '@lawprotect/shared-ts';

/**
 * AuditEventId value object
 * 
 * Represents a unique identifier for audit events, extending the base
 * Identifier class for consistency with other value objects.
 */
export class AuditEventId extends Identifier<string> {
  constructor(value: string) {
    super(value);
    this.validate(value);
  }

  /**
   * Validates the audit event ID format
   * @param value - The value to validate
   * @throws {Error} If the value is not a valid UUID v4
   */
  private validate(value: string): void {
    if (!isUuidV4(value)) {
      throw new BadRequestError('AuditEventId must be a valid UUID v4', 'INVALID_AUDIT_EVENT_ID');
    }
  }

  /**
   * Checks if this AuditEventId equals another AuditEventId
   */
  equals(other: AuditEventId): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Returns the string representation of the audit event ID
   */
  toString(): string {
    return this.getValue();
  }

  /**
   * Returns the JSON representation of the audit event ID
   */
  toJSON(): string {
    return this.getValue();
  }
}
