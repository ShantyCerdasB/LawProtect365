/**
 * @fileoverview InvitationTokenId value object - Unique identifier for invitation tokens
 * @summary Value object for invitation token identification
 * @description The InvitationTokenId value object represents a unique identifier
 * for invitation tokens, extending the base Identifier class.
 */

import { Identifier } from '@lawprotect/shared-ts';

/**
 * InvitationTokenId value object
 * 
 * Represents a unique identifier for invitation tokens,
 * extending the base Identifier class for type safety.
 */
export class InvitationTokenId extends Identifier<string> {
  constructor(value: string) {
    super(value);
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
