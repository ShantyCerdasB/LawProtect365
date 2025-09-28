/**
 * @fileoverview KMSKeyId value object - Represents a validated KMS key identifier
 * @summary Encapsulates KMS key ID validation and equality logic
 * @description The KMSKeyId value object ensures KMS key identifiers are valid
 * and provides type safety for KMS key handling throughout the system.
 */

import { BadRequestError, ErrorCodes } from '../../errors/index.js';

/**
 * KMSKeyId value object
 * 
 * Represents a validated KMS key identifier with proper format validation.
 * Ensures KMS key IDs follow AWS KMS naming conventions and are valid for use.
 */
export class KMSKeyId {
  constructor(
    private readonly keyId: string,
    allowedKeys: string[] = []
  ) {
    if (!keyId || typeof keyId !== 'string') {
      throw new BadRequestError('KMSKeyId must be a non-empty string', ErrorCodes.COMMON_BAD_REQUEST);
    }

    const trimmedKeyId = keyId.trim();
    
    if (trimmedKeyId.length === 0) {
      throw new BadRequestError('KMSKeyId cannot be empty', ErrorCodes.COMMON_BAD_REQUEST);
    }

    if (!this.isValidKMSKeyFormat(trimmedKeyId)) {
      throw new BadRequestError('KMSKeyId must be a valid AWS KMS key format', ErrorCodes.COMMON_BAD_REQUEST);
    }

    if (allowedKeys.length > 0 && !allowedKeys.includes(trimmedKeyId)) {
      throw new BadRequestError(`KMS key ${trimmedKeyId} is not allowed`, ErrorCodes.COMMON_BAD_REQUEST);
    }

    this.keyId = trimmedKeyId;
  }

  /**
   * Creates a KMSKeyId from a string value
   * @param keyId - The KMS key ID string
   * @param allowedKeys - Optional list of allowed KMS keys
   */
  static fromString(keyId: string, allowedKeys: string[] = []): KMSKeyId {
    return new KMSKeyId(keyId, allowedKeys);
  }

  /**
   * Gets the KMS key ID value
   */
  getValue(): string {
    return this.keyId;
  }

  /**
   * Checks if this is an alias (starts with 'alias/')
   */
  isAlias(): boolean {
    return this.keyId.startsWith('alias/');
  }

  /**
   * Checks if this is a key ID (UUID format)
   */
  isKeyId(): boolean {
    return this.isValidUUID(this.keyId);
  }

  /**
   * Checks if this is an ARN (starts with 'arn:')
   */
  isArn(): boolean {
    return this.keyId.startsWith('arn:');
  }

  /**
   * Gets the key type based on format
   */
  getKeyType(): 'alias' | 'key-id' | 'arn' {
    if (this.isAlias()) return 'alias';
    if (this.isArn()) return 'arn';
    return 'key-id';
  }

  /**
   * Gets the alias name if this is an alias
   */
  getAliasName(): string | undefined {
    if (this.isAlias()) {
      return this.keyId.substring(6); // Remove 'alias/' prefix
    }
    return undefined;
  }

  /**
   * Validates KMS key format
   * @param keyId - The key ID to validate
   * @returns true if valid
   */
  private isValidKMSKeyFormat(keyId: string): boolean {
    // Check for alias format
    if (keyId.startsWith('alias/')) {
      const aliasName = keyId.substring(6);
      return aliasName.length > 0 && aliasName.length <= 256 && /^[a-zA-Z0-9/_-]+$/.test(aliasName);
    }
    
    // Check for ARN format
    if (keyId.startsWith('arn:aws:kms:')) {
      const arnRegex = /^arn:aws:kms:[a-z0-9-]+:\d{12}:(key|alias)\/[a-zA-Z0-9/_-]+$/;
      return arnRegex.test(keyId);
    }
    
    // Check for UUID format (key ID)
    return this.isValidUUID(keyId);
  }

  /**
   * Validates UUID format
   * @param value - The value to validate
   * @returns true if valid UUID
   */
  private isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Checks if this KMSKeyId equals another KMSKeyId
   * @param other - Other KMSKeyId to compare
   * @returns true if key IDs are equal
   */
  equals(other: KMSKeyId): boolean {
    return this.keyId === other.keyId;
  }

  /**
   * Returns the string representation of the KMS key ID
   */
  toString(): string {
    return this.keyId;
  }

  /**
   * Returns the JSON representation of the KMS key ID
   */
  toJSON(): string {
    return this.keyId;
  }
}

