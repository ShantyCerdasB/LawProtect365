/**
 * @fileoverview S3Operation value object - Represents a validated S3 operation type
 * @summary Encapsulates S3 operation validation and equality logic
 * @description The S3Operation value object ensures S3 operation types are valid
 * and provides type safety for S3 operations throughout the system.
 */

import { BadRequestError, ErrorCodes } from '../../errors/index.js';
import { S3OperationType } from '../../enums/index.js';

/**
 * S3Operation value object
 * 
 * Represents a validated S3 operation type with proper validation.
 * Ensures operation types are valid for S3 presigned URL generation.
 */
export class S3Operation {
  constructor(private readonly operation: S3OperationType) {
    if (!Object.values(S3OperationType).includes(operation)) {
      throw new BadRequestError('Invalid S3 operation type', 'INVALID_S3_OPERATION');
    }
  }

  /**
   * Creates an S3Operation from a string value
   * @param value - The operation string
   */
  static fromString(value: string): S3Operation {
    if (!Object.values(S3OperationType).includes(value as S3OperationType)) {
      throw new BadRequestError(
        `Invalid S3 operation type: ${value}. Must be one of: ${Object.values(S3OperationType).join(', ')}`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
    return new S3Operation(value as S3OperationType);
  }

  /**
   * Creates a GET operation
   */
  static get(): S3Operation {
    return new S3Operation(S3OperationType.GET);
  }

  /**
   * Creates a PUT operation
   */
  static put(): S3Operation {
    return new S3Operation(S3OperationType.PUT);
  }

  /**
   * Gets the operation value
   */
  getValue(): S3OperationType {
    return this.operation;
  }

  /**
   * Checks if this is a GET operation
   */
  isGet(): boolean {
    return this.operation === S3OperationType.GET;
  }

  /**
   * Checks if this is a PUT operation
   */
  isPut(): boolean {
    return this.operation === S3OperationType.PUT;
  }

  /**
   * Checks if this is a read operation (GET)
   */
  isReadOperation(): boolean {
    return this.isGet();
  }

  /**
   * Checks if this is a write operation (PUT)
   */
  isWriteOperation(): boolean {
    return this.isPut();
  }

  /**
   * Checks if this S3Operation equals another S3Operation
   * @param other - Other S3Operation to compare
   * @returns true if operations are equal
   */
  equals(other: S3Operation): boolean {
    return this.operation === other.operation;
  }

  /**
   * Returns the string representation of the operation
   */
  toString(): string {
    return this.operation;
  }

  /**
   * Returns the JSON representation of the operation
   */
  toJSON(): string {
    return this.operation;
  }
}
