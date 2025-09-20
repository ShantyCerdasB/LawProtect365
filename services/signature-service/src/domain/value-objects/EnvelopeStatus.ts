/**
 * @fileoverview EnvelopeStatus value object - Represents the status of an envelope
 * @summary Encapsulates envelope status logic and validation
 * @description The EnvelopeStatus value object defines the current state of an envelope
 * in the signing process and provides business logic for status transitions.
 */

import { EnvelopeStatus as PrismaEnvelopeStatus } from '@prisma/client';
import { BadRequestError } from '@lawprotect/shared-ts';

/**
 * EnvelopeStatus value object
 * 
 * Represents the current status of an envelope in the signing process.
 * Provides business logic for status transitions and state validation.
 */
export class EnvelopeStatus {
  constructor(private readonly status: PrismaEnvelopeStatus) {
    if (!Object.values(PrismaEnvelopeStatus).includes(status)) {
      throw new BadRequestError('Invalid EnvelopeStatus value', 'INVALID_ENVELOPE_STATUS');
    }
  }

  /**
   * Creates an EnvelopeStatus for draft state
   */
  static draft(): EnvelopeStatus {
    return new EnvelopeStatus(PrismaEnvelopeStatus.DRAFT);
  }

  /**
   * Creates an EnvelopeStatus for ready for signature state
   */
  static readyForSignature(): EnvelopeStatus {
    return new EnvelopeStatus(PrismaEnvelopeStatus.READY_FOR_SIGNATURE);
  }

  /**
   * Creates an EnvelopeStatus for completed state
   */
  static completed(): EnvelopeStatus {
    return new EnvelopeStatus(PrismaEnvelopeStatus.COMPLETED);
  }

  /**
   * Creates an EnvelopeStatus for declined state
   */
  static declined(): EnvelopeStatus {
    return new EnvelopeStatus(PrismaEnvelopeStatus.DECLINED);
  }

  /**
   * Creates an EnvelopeStatus for cancelled state
   */
  static cancelled(): EnvelopeStatus {
    return new EnvelopeStatus(PrismaEnvelopeStatus.CANCELLED);
  }

  /**
   * Creates an EnvelopeStatus for expired state
   */
  static expired(): EnvelopeStatus {
    return new EnvelopeStatus(PrismaEnvelopeStatus.EXPIRED);
  }

  /**
   * Creates an EnvelopeStatus from a string value
   * @param status - The status string
   */
  static fromString(status: string): EnvelopeStatus {
    if (!Object.values(PrismaEnvelopeStatus).includes(status as PrismaEnvelopeStatus)) {
      throw new BadRequestError('Invalid EnvelopeStatus string', 'INVALID_ENVELOPE_STATUS');
    }
    return new EnvelopeStatus(status as PrismaEnvelopeStatus);
  }

  /**
   * Gets the status value
   */
  getValue(): PrismaEnvelopeStatus {
    return this.status;
  }

  /**
   * Checks if the envelope is in draft state
   */
  isDraft(): boolean {
    return this.status === PrismaEnvelopeStatus.DRAFT;
  }

  /**
   * Checks if the envelope is ready for signature
   */
  isReadyForSignature(): boolean {
    return this.status === PrismaEnvelopeStatus.READY_FOR_SIGNATURE;
  }

  /**
   * Checks if the envelope is completed
   */
  isCompleted(): boolean {
    return this.status === PrismaEnvelopeStatus.COMPLETED;
  }

  /**
   * Checks if the envelope is declined
   */
  isDeclined(): boolean {
    return this.status === PrismaEnvelopeStatus.DECLINED;
  }

  /**
   * Checks if the envelope is cancelled
   */
  isCancelled(): boolean {
    return this.status === PrismaEnvelopeStatus.CANCELLED;
  }

  /**
   * Checks if the envelope is expired
   */
  isExpired(): boolean {
    return this.status === PrismaEnvelopeStatus.EXPIRED;
  }

  /**
   * Checks if the envelope is in a final state (cannot be modified)
   */
  isInFinalState(): boolean {
    return this.isCompleted() || this.isDeclined() || this.isCancelled() || this.isExpired();
  }

  /**
   * Checks if the envelope can be modified
   */
  canBeModified(): boolean {
    return this.isDraft() || this.isReadyForSignature();
  }

  /**
   * Checks if the envelope can be sent
   */
  canBeSent(): boolean {
    return this.isDraft();
  }

  /**
   * Checks if the envelope can be cancelled
   */
  canBeCancelled(): boolean {
    return this.isDraft() || this.isReadyForSignature();
  }

  /**
   * Checks if this status equals another status
   * @param other - Other status to compare
   * @returns true if statuses are equal
   */
  equals(other: EnvelopeStatus): boolean {
    return this.status === other.status;
  }

  /**
   * Returns the string representation of the status
   */
  toString(): string {
    return this.status;
  }

  /**
   * Returns the JSON representation of the status
   */
  toJSON(): string {
    return this.status;
  }
}
