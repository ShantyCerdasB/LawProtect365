/**
 * @fileoverview SigningOrder value object - Represents the signing order configuration
 * @summary Encapsulates signing order logic and validation
 * @description The SigningOrder value object defines how signers should sign the document,
 * either with the owner signing first or invitees signing first.
 */

import { SigningOrderType } from '@prisma/client';
import { BadRequestError } from '@lawprotect/shared-ts';

/**
 * SigningOrder value object
 * 
 * Represents the signing order configuration for an envelope.
 * Defines whether the owner signs first or invitees sign first.
 */
export class SigningOrder {
  private readonly type: SigningOrderType;

  constructor(type: SigningOrderType) {
    if (!type || !Object.values(SigningOrderType).includes(type)) {
      throw new BadRequestError('SigningOrder type must be a valid SigningOrderType', 'INVALID_SIGNING_ORDER_TYPE');
    }

    this.type = type;
  }

  /**
   * Creates a SigningOrder with owner first configuration
   */
  static ownerFirst(): SigningOrder {
    return new SigningOrder(SigningOrderType.OWNER_FIRST);
  }

  /**
   * Creates a SigningOrder with invitees first configuration
   */
  static inviteesFirst(): SigningOrder {
    return new SigningOrder(SigningOrderType.INVITEES_FIRST);
  }

  /**
   * Creates a SigningOrder from a string value
   */
  static fromString(type: string): SigningOrder {
    if (!Object.values(SigningOrderType).includes(type as SigningOrderType)) {
      throw new BadRequestError('Invalid SigningOrderType string', 'INVALID_SIGNING_ORDER_TYPE');
    }
    return new SigningOrder(type as SigningOrderType);
  }

  /**
   * Gets the signing order type
   */
  getType(): SigningOrderType {
    return this.type;
  }

  /**
   * Checks if owner should sign first
   */
  isOwnerFirst(): boolean {
    return this.type === SigningOrderType.OWNER_FIRST;
  }

  /**
   * Checks if invitees should sign first
   */
  isInviteesFirst(): boolean {
    return this.type === SigningOrderType.INVITEES_FIRST;
  }

  /**
   * Checks if this SigningOrder equals another SigningOrder
   */
  equals(other: SigningOrder): boolean {
    return this.type === other.type;
  }

  /**
   * Returns the string representation of the signing order
   */
  toString(): string {
    return this.type;
  }

  /**
   * Returns the JSON representation of the signing order
   */
  toJSON(): string {
    return this.type;
  }
}
