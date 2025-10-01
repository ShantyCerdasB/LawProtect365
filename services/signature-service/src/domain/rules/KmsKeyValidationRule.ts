/**
 * @fileoverview KmsKeyValidationRule - Domain rule for KMS key validation
 * @summary Validates KMS key availability and configuration for signing operations
 * @description This domain rule validates that KMS keys are properly configured
 * and available for digital signature operations. It ensures keys are enabled,
 * configured for signing, and accessible by the current AWS credentials.
 */

import { KmsSigner } from '@lawprotect/shared-ts';
import { KMSKeyId } from '@lawprotect/shared-ts';
import { 
  kmsKeyNotFound,
  kmsPermissionDenied,
  kmsValidationFailed
} from '../../signature-errors';

/**
 * Domain rule that validates KMS keys for digital signature operations
 */
export class KmsKeyValidationRule {
  constructor(
    private readonly kmsSigner: KmsSigner
  ) {}

  /**
   * Validates that a KMS key is properly configured for signing operations
   * @param kmsKeyId - The KMS key ID to validate
   * @returns Promise that resolves if key is valid for signing
   * @throws kmsKeyNotFound when KMS key is not found
   * @throws kmsPermissionDenied when KMS permissions are insufficient
   * @throws kmsValidationFailed when key is not configured for signing
   */
  async validateKeyForSigning(kmsKeyId: string): Promise<void> {
    try {
      KMSKeyId.fromString(kmsKeyId);

      const keyMetadata = await this.kmsSigner.describeKey(kmsKeyId);

      if (!keyMetadata.enabled) {
        throw kmsValidationFailed(`KMS key is not enabled. Current state: ${keyMetadata.keyState}`);
      }

      if (keyMetadata.keyUsage !== 'SIGN_VERIFY') {
        throw kmsValidationFailed(`KMS key is not configured for signing. Current usage: ${keyMetadata.keyUsage}`);
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('NotFoundException') || error.message.includes('not found')) {
          throw kmsKeyNotFound(`KMS key not found: ${kmsKeyId}`);
        }
        if (error.message.includes('AccessDenied') || error.message.includes('permission')) {
          throw kmsPermissionDenied(`KMS permission denied for key: ${kmsKeyId}`);
        }
        if (error.message.includes('validation') || error.message.includes('not configured')) {
          throw kmsValidationFailed(`KMS key validation failed: ${error.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Validates multiple KMS keys for signing operations
   * @param kmsKeyIds - Array of KMS key IDs to validate
   * @returns Promise that resolves if all keys are valid for signing
   */
  async validateKeysForSigning(kmsKeyIds: string[]): Promise<void> {
    const validationPromises = kmsKeyIds.map(keyId => 
      this.validateKeyForSigning(keyId)
    );

    await Promise.all(validationPromises);
  }
}