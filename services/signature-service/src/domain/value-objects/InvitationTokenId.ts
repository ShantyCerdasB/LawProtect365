/**
 * @fileoverview InvitationTokenId value object - Represents a unique invitation token identifier
 * @summary Encapsulates invitation token ID validation and equality logic
 * @description The InvitationTokenId value object ensures invitation token identifiers are valid UUIDs
 * and provides type safety for invitation token identification throughout the system.
 */

import { Identifier, uuid, isUuidV4 } from '@lawprotect/shared-ts';
import { envelopeNotFound } from '../../signature-errors';

/**
 * InvitationTokenId value object
 * 
 * Represents a unique identifier for an invitation token. Ensures the ID is a valid UUID
 * and provides type safety for invitation token identification.
 */
export class InvitationTokenId extends Identifier<string> {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw envelopeNotFound('InvitationTokenId must be a non-empty string');
    }

    if (!isUuidV4(value)) {
      throw envelopeNotFound('InvitationTokenId must be a valid UUID');
    }

    super(value);
  }

  /**
   * Creates a new InvitationTokenId with a random UUID
   */
  static generate(): InvitationTokenId {
    return new InvitationTokenId(uuid());
  }

  /**
   * Creates an InvitationTokenId from a string value
   */
  static fromString(value: string): InvitationTokenId {
    return new InvitationTokenId(value);
  }

  /**
   * Creates an InvitationTokenId from a string value or returns undefined if null/undefined
   * @param value - String value to convert
   * @returns InvitationTokenId instance or undefined
   */
  static fromStringOrUndefined(value: string | undefined): InvitationTokenId | undefined {
    if (!value) {
      return undefined;
    }
    return new InvitationTokenId(value);
  }

  /**
   * Checks if this InvitationTokenId equals another InvitationTokenId
   */
  equals(other: InvitationTokenId): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Returns the string representation of the invitation token ID
   */
  toString(): string {
    return this.getValue();
  }

  /**
   * Returns the JSON representation of the invitation token ID
   */
  toJSON(): string {
    return this.getValue();
  }
}