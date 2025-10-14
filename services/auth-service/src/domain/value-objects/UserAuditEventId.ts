/**
 * @fileoverview UserAuditEventId value object - Represents a unique audit event identifier
 * @summary Encapsulates audit event ID validation and equality logic
 * @description The UserAuditEventId value object ensures audit event identifiers are valid UUIDs
 * and provides type safety for audit event identification throughout the system.
 */

import { Identifier, uuid, isUuidV4 } from '@lawprotect/shared-ts';
import { userNotFound } from '../../auth-errors';

/**
 * UserAuditEventId value object
 * 
 * Represents a unique identifier for an audit event. Ensures the ID is a valid UUID
 * and provides type safety for audit event identification.
 */
export class UserAuditEventId extends Identifier<string> {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw userNotFound('UserAuditEventId must be a non-empty string');
    }

    if (!isUuidV4(value)) {
      throw userNotFound('UserAuditEventId must be a valid UUID');
    }

    super(value);
  }

  /**
   * Creates a new UserAuditEventId with a random UUID
   */
  static generate(): UserAuditEventId {
    return new UserAuditEventId(uuid());
  }

  /**
   * Creates a UserAuditEventId from a string value
   */
  static fromString(value: string): UserAuditEventId {
    return new UserAuditEventId(value);
  }

  /**
   * Checks if this UserAuditEventId equals another UserAuditEventId
   */
  equals(other: UserAuditEventId): boolean {
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
