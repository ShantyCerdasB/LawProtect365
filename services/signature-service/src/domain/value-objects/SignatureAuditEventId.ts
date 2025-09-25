/**
 * @fileoverview SignatureAuditEventId value object - Represents a unique audit event identifier
 * @summary Encapsulates audit event ID validation and equality logic
 * @description The SignatureAuditEventId value object ensures audit event identifiers are valid UUIDs
 * and provides type safety for audit event identification throughout the system.
 */

import { Identifier, uuid, isUuidV4 } from '@lawprotect/shared-ts';
import { invalidEntity } from '../../signature-errors';

/**
 * SignatureAuditEventId value object
 * 
 * Represents a unique identifier for an audit event. Ensures the ID is a valid UUID
 * and provides type safety for audit event identification.
 */
export class SignatureAuditEventId extends Identifier<string> {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw invalidEntity({
        operation: 'SignatureAuditEventId constructor',
        reason: 'SignatureAuditEventId must be a non-empty string'
      });
    }

    if (!isUuidV4(value)) {
      throw invalidEntity({
        operation: 'SignatureAuditEventId constructor',
        reason: 'SignatureAuditEventId must be a valid UUID'
      });
    }

    super(value);
  }

  /**
   * Creates a new SignatureAuditEventId with a random UUID
   */
  static generate(): SignatureAuditEventId {
    return new SignatureAuditEventId(uuid());
  }

  /**
   * Creates a SignatureAuditEventId from a string value
   */
  static fromString(value: string): SignatureAuditEventId {
    return new SignatureAuditEventId(value);
  }

  /**
   * Creates a SignatureAuditEventId from a string value or returns undefined if null/undefined
   * @param value - String value or null/undefined
   * @returns SignatureAuditEventId instance or undefined
   */
  static fromStringOrUndefined(value: string | null | undefined): SignatureAuditEventId | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    return new SignatureAuditEventId(value);
  }

  /**
   * Checks if this SignatureAuditEventId equals another SignatureAuditEventId
   */
  equals(other: SignatureAuditEventId): boolean {
    if (!other || typeof other.getValue !== 'function') {
      return false;
    }
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
