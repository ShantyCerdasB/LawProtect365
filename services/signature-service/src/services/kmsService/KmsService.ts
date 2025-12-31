/**
 * @fileoverview KmsService - AWS KMS cryptographic operations service
 * @summary Handles cryptographic signing, verification, and certificate generation using AWS KMS
 * @description
 * Service responsible for cryptographic operations using AWS KMS. Handles document hash signing,
 * signature verification, certificate chain generation, and KMS key validation. The private key
 * never leaves AWS KMS infrastructure, ensuring maximum security.
 * 
 * Responsibilities:
 * - Sign document hashes using KMS
 * - Verify signatures using KMS
 * - Generate self-signed certificates from KMS public keys
 * - Validate KMS key availability and configuration
 * 
 * Does not handle:
 * - Persistence (repositories)
 * - Business logic validation (domain entities/rules)
 * - Audit logging (audit services)
 * - S3 operations (S3Service)
 */

import { mapAwsError, BadRequestError, KmsSigner, hexToUint8Array, uint8ArrayToHex, pickMessageType, KMSKeyId, DocumentHash, getNumber } from '@lawprotect/shared-ts';
import { KMSClient, SignCommand, VerifyCommand, GetPublicKeyCommand, type SigningAlgorithmSpec } from '@aws-sdk/client-kms';
import { SigningAlgorithm } from '@/domain/value-objects/SigningAlgorithm';
import { KmsKeyValidationRule } from '@/domain/rules/KmsKeyValidationRule';
import { 
  KmsSignRequest, 
  KmsSignResult, 
  KmsVerifyRequest, 
  KmsVerifyResult
} from '@/domain/types/kms';
import { 
  kmsKeyNotFound,
  kmsPermissionDenied,
  kmsSigningFailed,
  kmsValidationFailed
} from '@/signature-errors';
import { CertificateGenerator } from './CertificateGenerator';

/**
 * @description
 * Service for AWS KMS cryptographic operations. Provides signing, verification, and certificate
 * generation capabilities for digital signatures. All private key operations remain within AWS KMS.
 */
export class KmsService {
  private readonly keyValidationRule: KmsKeyValidationRule;
  private readonly certificateGenerator: CertificateGenerator;

  constructor(
    private readonly kmsClient: KMSClient
  ) {
    const kmsSigner = new KmsSigner(kmsClient);
    this.keyValidationRule = new KmsKeyValidationRule(kmsSigner);
    this.certificateGenerator = new CertificateGenerator();
  }

  /**
   * @description
   * Signs a document hash using AWS KMS. The private key never leaves KMS infrastructure.
   * Validates input parameters, converts hash to binary format, and performs KMS signing operation.
   * @param {KmsSignRequest} request - Signing request with document hash, KMS key ID, and algorithm
   * @returns {Promise<KmsSignResult>} Promise resolving to signature bytes, hash, and metadata
   * @throws {BadRequestError} when request validation fails
   * @throws {InternalError} when KMS key is not found, permissions denied, or signing fails
   */
  async sign(request: KmsSignRequest): Promise<KmsSignResult> {
    try {
      const kmsKeyId = KMSKeyId.fromString(request.kmsKeyId);
      const signingAlgorithm = SigningAlgorithm.fromString(request.algorithm);
      const documentHash = DocumentHash.fromString(request.documentHash);

      const hashBytes = hexToUint8Array(documentHash.getValue());

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
   * @description
   * Verifies a signature using AWS KMS. Validates that the signature matches the document hash
   * and was created with the specified KMS key. Uses KMS verification to ensure cryptographic integrity.
   * @param {KmsVerifyRequest} request - Verification request with document hash, signature, and key ID
   * @returns {Promise<KmsVerifyResult>} Promise resolving to verification result with validity status
   * @throws {BadRequestError} when request validation fails
   * @throws {InternalError} when KMS key is not found, permissions denied, or verification fails
   */
  async verify(request: KmsVerifyRequest): Promise<KmsVerifyResult> {
    try {
      const kmsKeyId = KMSKeyId.fromString(request.kmsKeyId);
      const documentHash = DocumentHash.fromString(request.documentHash);
      const signingAlgorithm = SigningAlgorithm.fromString(request.algorithm || 'RSASSA_PSS_SHA_256');

      const hashBytes = hexToUint8Array(documentHash.getValue());
      const signatureBytes = hexToUint8Array(request.signature);

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
   * @description
   * Retrieves certificate chain for a KMS key. Since AWS KMS does not provide certificates directly,
   * this method retrieves the public key from KMS and generates a self-signed X.509 certificate.
   * The certificate contains only the public key and metadata; the private key remains in KMS.
   * 
   * Self-signed certificates are:
   * - Technically valid for PDF digital signatures (RFC 5652)
   * - Legally valid according to eSign/UETA
   * - May show "Unknown Issuer" in PDF readers (signature remains cryptographically valid)
   * 
   * Certificate validity period is configured via CERTIFICATE_VALIDITY_DAYS environment variable.
   * @param {string} kmsKeyId - KMS key ID to get certificate chain for
   * @param {Object} signerInfo - Optional signer information for certificate subject (name, email)
   * @returns {Promise<Uint8Array[]>} Promise resolving to certificate chain as DER-encoded bytes (leaf to root)
   * @throws {InternalError} when KMS key is not found, permissions denied, or certificate generation fails
   */
  async getCertificateChain(
    kmsKeyId: string,
    signerInfo?: { name?: string; email?: string }
  ): Promise<Uint8Array[]> {
    try {
      const kmsKeyIdVO = KMSKeyId.fromString(kmsKeyId);
      
      const getPublicKeyCommand = new GetPublicKeyCommand({
        KeyId: kmsKeyIdVO.getValue(),
      });
      
      const publicKeyResult = await this.kmsClient.send(getPublicKeyCommand);
      
      if (!publicKeyResult.PublicKey) {
        throw kmsKeyNotFound(`Public key not found for KMS key: ${kmsKeyId}`);
      }

      const publicKeyDer = publicKeyResult.PublicKey;
      const certificateValidityDays = getNumber('CERTIFICATE_VALIDITY_DAYS', 365);
      
      if (!certificateValidityDays || certificateValidityDays <= 0) {
        throw kmsValidationFailed('CERTIFICATE_VALIDITY_DAYS must be a positive number');
      }
      
      const certificateDer = await this.certificateGenerator.generateSelfSignedCertificate({
        publicKeyDer,
        subject: {
          commonName: signerInfo?.name || 'LawProtect365 Document Signing Key',
          organization: 'LawProtect365',
          organizationalUnit: 'Digital Signatures',
          country: 'US',
          emailAddress: signerInfo?.email,
        },
        validityDays: certificateValidityDays,
      });

      return [certificateDer];
      
    } catch (error) {
      this.handleKmsError(error, 'getCertificateChain', kmsKeyId);
    }
  }


  /**
   * @description
   * Validates KMS key format, availability, and configuration for signing operations.
   * Checks that the key exists, is accessible, and is configured for cryptographic signing.
   * @param {string} kmsKeyId - KMS key ID to validate
   * @returns {Promise<boolean>} Promise resolving to true if key is valid for signing
   * @throws {BadRequestError} when key format is invalid
   * @throws {InternalError} when KMS key is not found, permissions denied, or key is not configured for signing
   */
  async validateKmsKey(kmsKeyId: string): Promise<boolean> {
    await this.keyValidationRule.validateKeyForSigning(kmsKeyId);
    return true;
  }

  /**
   * @description
   * Handles KMS-specific errors and maps them to domain errors. Analyzes error messages
   * and error types to determine the appropriate domain error to throw.
   * @param {unknown} error - The error to handle
   * @param {string} operation - The operation that failed (for context in error messages)
   * @param {string} kmsKeyId - The KMS key ID involved in the operation
   * @returns {never} Always throws a domain error
   */
  private handleKmsError(error: unknown, operation: string, kmsKeyId: string): never {
    if (error instanceof BadRequestError) {
      throw error;
    }

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

    throw mapAwsError(error, `KmsService.${operation}`);
  }
}