/**
 * @fileoverview CognitoSub value object - Represents a Cognito subject identifier
 * @summary Encapsulates Cognito sub validation and equality logic
 * @description The CognitoSub value object ensures Cognito subject identifiers are valid
 * and provides type safety for Cognito user identification.
 */

import { StringValueObject } from '@lawprotect/shared-ts';
import { invalidCognitoSub } from '../../auth-errors';

/**
 * CognitoSub value object
 * 
 * Represents a Cognito subject identifier. Ensures the sub is valid
 * and provides type safety for Cognito user identification.
 */
export class CognitoSub extends StringValueObject {
  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw invalidCognitoSub('CognitoSub must be a non-empty string');
    }

    if (value.length < 10 || value.length > 255) {
      throw invalidCognitoSub('CognitoSub must be between 10 and 255 characters');
    }

    super(value);
  }

  /**
   * Creates a CognitoSub from a string value
   */
  static fromString(value: string): CognitoSub {
    return new CognitoSub(value);
  }

  /**
   * Checks if this CognitoSub equals another CognitoSub
   */
  equals(other: CognitoSub): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Returns the string representation of the Cognito sub
   */
  toString(): string {
    return this.getValue();
  }

  /**
   * Returns the JSON representation of the Cognito sub
   */
  toJSON(): string {
    return this.getValue();
  }
}
