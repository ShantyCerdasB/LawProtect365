/**
 * @fileoverview KmsService - Service for cryptographic operations only
 * @summary Handles only KMS cryptographic operations for digital signatures
 * @description This service is responsible ONLY for cryptographic operations using AWS KMS.
 * It does not handle persistence, validation, or business logic - those are handled by other services.
 * This service focuses solely on the cryptographic aspects of digital signature creation and verification.
 */

import { mapAwsError, BadRequestError, KmsSigner, hexToUint8Array, uint8ArrayToHex, pickMessageType } from '@lawprotect/shared-ts';
import { KMSClient, SignCommand, VerifyCommand, type SigningAlgorithmSpec } from '@aws-sdk/client-kms';
import { KMSKeyId } from '../domain/value-objects/KMSKeyId';
import { SigningAlgorithm } from '../domain/value-objects/SigningAlgorithm';
import { DocumentHash } from '../domain/value-objects/DocumentHash';
import { KmsKeyValidationRule } from '../domain/rules/KmsKeyValidationRule';
import { 
  KmsSignRequest, 
  KmsSignResult, 
  KmsVerifyRequest, 
  KmsVerifyResult 
} from '../domain/types/kms';
import { 
  kmsKeyNotFound,
  kmsPermissionDenied,
  kmsSigningFailed,
  kmsValidationFailed
} from '../signature-errors';

/**
 * KmsService - Service for cryptographic operations only
 * 
 * This service handles ONLY cryptographic operations using AWS KMS.
 * It does not handle:
 * - Persistence (handled by repositories)
 * - Business logic validation (handled by entities and other services)
 * - Audit logging (handled by audit services)
 * - S3 operations (handled by S3Service)
 * 
 * Responsibilities:
 * - Sign document hashes using KMS
 * - Verify signatures using KMS
 * - Validate KMS key availability
 * - Handle KMS-specific errors
 */
export class KmsService {
  private readonly keyValidationRule: KmsKeyValidationRule;

  constructor(
    private readonly kmsClient: KMSClient
  ) {
    // Create KmsSigner for validation purposes (uses same client)
    const kmsSigner = new KmsSigner(kmsClient);
    this.keyValidationRule = new KmsKeyValidationRule(kmsSigner);
  }

  /**
   * Signs a document hash using KMS
   * @param request - The signing request containing document hash, key ID, and algorithm
   * @returns Promise with signature bytes, hash, and metadata
   * @throws BadRequestError when request validation fails
   * @throws kmsKeyNotFound when KMS key is not found
   * @throws kmsPermissionDenied when KMS permissions are insufficient
   * @throws kmsSigningFailed when signing operation fails
   */
  async sign(request: KmsSignRequest): Promise<KmsSignResult> {
    try {
      // Validate input parameters using value objects
      const kmsKeyId = KMSKeyId.fromString(request.kmsKeyId);
      const signingAlgorithm = SigningAlgorithm.fromString(request.algorithm);
      const documentHash = DocumentHash.fromString(request.documentHash);

      // Convert hex hash to Uint8Array for KMS
      const hashBytes = hexToUint8Array(documentHash.getValue());

      // Perform KMS signing operation directly
      const signCommand = new SignCommand({
        KeyId: kmsKeyId.getValue(),
        Message: hashBytes,
        MessageType: pickMessageType(hashBytes, signingAlgorithm.getValue()),
        SigningAlgorithm: signingAlgorithm.getValue() as unknown as SigningAlgorithmSpec
      });

      const result = await this.kmsClient.send(signCommand);

      if (!result.Signature) {
        throw kmsSigningFailed('KMS signing operation returned an empty signature');
      }

      // Convert signature bytes to hex string for storage
      const signatureHash = uint8ArrayToHex(result.Signature);

      return {
        signatureBytes: result.Signature,
        signatureHash,
        algorithm: signingAlgorithm.getValue(),
        kmsKeyId: kmsKeyId.getValue(),
        signedAt: new Date()
      };

    } catch (error) {
      this.handleKmsError(error, 'sign', request.kmsKeyId);
    }
  }

  /**
   * Verifies a signature using KMS
   * @param request - The verification request containing document hash, signature, and key ID
   * @returns Promise with verification result
   * @throws BadRequestError when request validation fails
   * @throws kmsKeyNotFound when KMS key is not found
   * @throws kmsPermissionDenied when KMS permissions are insufficient
   * @throws kmsValidationFailed when verification operation fails
   */
  async verify(request: KmsVerifyRequest): Promise<KmsVerifyResult> {
    try {
      // Validate input parameters using value objects
      const kmsKeyId = KMSKeyId.fromString(request.kmsKeyId);
      const documentHash = DocumentHash.fromString(request.documentHash);
      const signingAlgorithm = SigningAlgorithm.fromString(request.algorithm || 'RSASSA_PSS_SHA_256');

      // Convert hex strings to Uint8Array for KMS
      const hashBytes = hexToUint8Array(documentHash.getValue());
      const signatureBytes = hexToUint8Array(request.signature);

      // Perform KMS verification operation directly
      const verifyCommand = new VerifyCommand({
        KeyId: kmsKeyId.getValue(),
        Message: hashBytes,
        MessageType: pickMessageType(hashBytes, signingAlgorithm.getValue()),
        Signature: signatureBytes,
        SigningAlgorithm: signingAlgorithm.getValue() as unknown as SigningAlgorithmSpec
      });

      const result = await this.kmsClient.send(verifyCommand);

      return {
        isValid: Boolean(result.SignatureValid),
        error: result.SignatureValid ? undefined : 'Signature verification failed'
      };

    } catch (error) {
      this.handleKmsError(error, 'verify', request.kmsKeyId);
    }
  }

  /**
   * Validates KMS key format, availability, and configuration
   * @param kmsKeyId - KMS key ID to validate
   * @returns Promise with validation result
   * @throws BadRequestError when key format is invalid
   * @throws kmsKeyNotFound when KMS key is not found
   * @throws kmsPermissionDenied when KMS permissions are insufficient
   * @throws kmsValidationFailed when key is not configured for signing
   */
  async validateKmsKey(kmsKeyId: string): Promise<boolean> {
    await this.keyValidationRule.validateKeyForSigning(kmsKeyId);
    return true;
  }

  /**
   * Handles KMS-specific errors and maps them to domain errors
   * @param error - The error to handle
   * @param operation - The operation that failed (for context)
   * @param kmsKeyId - The KMS key ID involved in the operation
   */
  private handleKmsError(error: unknown, operation: string, kmsKeyId: string): never {
    // Map domain-specific errors
    if (error instanceof BadRequestError) {
      throw error; // Re-throw validation errors
    }

    // Handle KMS-specific errors
    if (error instanceof Error) {
      if (error.message.includes('NotFoundException') || error.message.includes('not found')) {
        throw kmsKeyNotFound(`KMS key not found: ${kmsKeyId}`);
      }
      if (error.message.includes('AccessDenied') || error.message.includes('permission')) {
        throw kmsPermissionDenied(`KMS permission denied for key: ${kmsKeyId}`);
      }
      if (error.message.includes('signing') || error.message.includes('cryptographic')) {
        throw kmsSigningFailed(`KMS signing failed: ${error.message}`);
      }
      if (error.message.includes('verification') || error.message.includes('invalid')) {
        throw kmsValidationFailed(`KMS verification failed: ${error.message}`);
      }
    }

    // Fallback to generic AWS error mapping
    throw mapAwsError(error, `KmsService.${operation}`);
  }
}