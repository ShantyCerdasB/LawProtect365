/**
 * @fileoverview SignatureValidator - Domain-specific signature validation utilities
 * @summary Centralized signature validation utilities for the signature service
 * @description This file provides domain-specific signature validation utilities
 * that combine shared validation functions with signature service specific logic.
 */

import { Signature } from '@/domain/entities/Signature';
import { SignatureStatus } from '@lawprotect/shared-ts';
import { 
  signatureInvalid,
  signatureNotFound,
  signatureFailed
} from '@/signature-errors';
import {
  validateSignatureHash,
  validateSignatureTimestamp,
  validateIpAddressAndUserAgent
} from '@lawprotect/shared-ts';

/**
 * SignatureValidator class provides centralized signature validation utilities
 */
export class SignatureValidator {
  /**
   * Validates signature hash integrity
   * @param signature - The signature to validate
   * @throws {SignatureError} When hash validation fails
   * @returns void
   */
  static validateHashIntegrity(signature: Signature): void {
    if (!signature) {
      throw signatureNotFound('Signature is required for hash integrity validation');
    }

    try {
      validateSignatureHash(signature.getDocumentHash(), signature.getAlgorithm());
      validateSignatureHash(signature.getSignatureHash(), signature.getAlgorithm());
    } catch (error) {
      if (error instanceof Error) {
        throw signatureInvalid(error.message);
      }
      throw error;
    }
  }

  /**
   * Validates signature timestamp
   * @param signature - The signature to validate
   * @param maxAgeHours - Maximum age of signature in hours (default: 24)
   * @throws {SignatureError} When timestamp validation fails
   * @returns void
   */
  static validateTimestamp(signature: Signature, maxAgeHours: number = 24): void {
    if (!signature) {
      throw signatureNotFound('Signature is required for timestamp validation');
    }

    try {
      validateSignatureTimestamp(signature.getTimestamp(), maxAgeHours);
    } catch (error) {
      if (error instanceof Error) {
        throw signatureInvalid(error.message);
      }
      throw error;
    }
  }

  /**
   * Validates signature metadata integrity
   * @param signature - The signature to validate
   * @throws {SignatureError} When metadata validation fails
   * @returns void
   */
  static validateMetadataIntegrity(signature: Signature): void {
    if (!signature) {
      throw signatureNotFound('Signature is required for metadata validation');
    }

    const metadata = signature.getMetadata();
    
    // Validate IP address and user agent if present
    if (metadata.ipAddress && metadata.userAgent) {
      try {
        validateIpAddressAndUserAgent(metadata.ipAddress, metadata.userAgent, 500);
      } catch (error) {
        if (error instanceof Error) {
          throw signatureInvalid(`Invalid IP address or user agent: ${error.message}`);
        }
        throw error;
      }
    }

    // ESIGN Act compliant - certificate fingerprint validation not required
  }

  /**
   * Validates signature can be retrieved
   * @param signature - The signature to validate
   * @throws {SignatureError} When signature cannot be retrieved
   * @returns void
   */
  static validateCanBeRetrieved(signature: Signature): void {
    if (!signature) {
      throw signatureNotFound('Signature not found');
    }

    if (signature.getStatus() === SignatureStatus.FAILED) {
      throw signatureFailed('Cannot retrieve a failed signature');
    }
  }

  /**
   * Validates signature can be verified
   * @param signature - The signature to validate
   * @throws {SignatureError} When signature cannot be verified
   * @returns void
   */
  static validateCanBeVerified(signature: Signature): void {
    if (!signature) {
      throw signatureNotFound('Signature not found');
    }

    if (signature.getStatus() !== SignatureStatus.SIGNED) {
      throw signatureInvalid('Only signed signatures can be verified');
    }

    if (!signature.isValid()) {
      throw signatureInvalid('Signature is not valid');
    }
  }

  /**
   * Validates signature can be updated
   * @param signature - The signature to validate
   * @param newStatus - The new status to transition to
   * @throws {SignatureError} When signature cannot be updated
   * @returns void
   */
  static validateCanBeUpdated(signature: Signature, newStatus: SignatureStatus): void {
    if (!signature) {
      throw signatureNotFound('Signature is required for update validation');
    }

    if (signature.getStatus() === SignatureStatus.SIGNED) {
      throw signatureInvalid('Cannot update a signed signature');
    }

    if (signature.getStatus() === SignatureStatus.FAILED) {
      throw signatureFailed('Cannot update a failed signature');
    }

    // Validate that the new status is a valid transition
    if (newStatus === SignatureStatus.SIGNED && signature.getStatus() !== SignatureStatus.PENDING) {
      throw signatureInvalid('Only pending signatures can be signed');
    }
  }

  /**
   * Comprehensive signature validation
   * @param signature - The signature to validate
   * @param options - Validation options
   * @throws {SignatureError} When any validation fails
   * @returns void
   */
  static validateComprehensive(
    signature: Signature, 
    options: {
      validateHash?: boolean;
      validateTimestamp?: boolean;
      validateMetadata?: boolean;
      maxAgeHours?: number;
    } = {}
  ): void {
    const {
      validateHash = true,
      validateTimestamp = true,
      validateMetadata = true,
      maxAgeHours = 24
    } = options;

    if (validateHash) {
      this.validateHashIntegrity(signature);
    }

    if (validateTimestamp) {
      this.validateTimestamp(signature, maxAgeHours);
    }

    if (validateMetadata) {
      this.validateMetadataIntegrity(signature);
    }
  }
}
