/**
 * @fileoverview SignerValidator - Domain-specific signer validation utilities
 * @summary Centralized signer validation utilities for the signature service
 * @description This file provides domain-specific signer validation utilities
 * that combine shared validation functions with signer service specific logic.
 */

import { Signer } from '@/domain/entities/Signer';
import { 
  invalidSignerState,
  signerAlreadySigned,
  signerAlreadyDeclined
} from '@/signature-errors';
import { validateIpAddressAndUserAgent } from '@lawprotect/shared-ts';
import { SignerOperation } from '@lawprotect/shared-ts';

/**
 * SignerValidator class provides centralized signer validation utilities
 */
export class SignerValidator {
  /**
   * Validates signer can sign at this moment
   * @param signer - The signer to validate
   * @throws {SignatureError} When signer cannot sign
   * @returns void
   */
  static validateCanSign(signer: Signer): void {
    // Use entity's built-in validation
    signer.validateForSigning();
  }

  /**
   * Validates signer can decline
   * @param signer - The signer to validate
   * @throws {SignatureError} When signer cannot decline
   * @returns void
   */
  static validateCanDecline(signer: Signer): void {
    // Use entity's built-in validation
    if (signer.hasSigned()) {
      throw signerAlreadySigned('Cannot decline after signing');
    }

    if (signer.hasDeclined()) {
      throw signerAlreadyDeclined('Signer has already declined');
    }
  }

  /**
   * Validates signer can be removed from envelope
   * @param signer - The signer to validate
   * @throws {SignatureError} When signer cannot be removed
   * @returns void
   */
  static validateCanBeRemoved(signer: Signer): void {
    if (signer.hasSigned()) {
      throw signerAlreadySigned('Cannot remove signer who has already signed');
    }

    if (signer.hasDeclined()) {
      throw signerAlreadyDeclined('Cannot remove signer who has already declined');
    }
  }

  /**
   * Validates signer consent data
   * @param signer - The signer to validate
   * @param consentData - Consent data for validation
   * @throws {SignatureError} When consent validation fails
   * @returns void
   */
  static validateConsentData(
    _signer: Signer,
    consentData: {
      consentGiven: boolean;
      consentTimestamp: Date;
      ipAddress: string;
      userAgent: string;
    }
  ): void {
    const { consentGiven, consentTimestamp, ipAddress, userAgent } = consentData;

    if (!consentGiven) {
      throw invalidSignerState('Consent must be given before proceeding');
    }

    if (!consentTimestamp || consentTimestamp > new Date()) {
      throw invalidSignerState('Invalid consent timestamp');
    }

    // Validate IP and UserAgent using shared utilities
    try {
      validateIpAddressAndUserAgent(ipAddress, userAgent, 500);
    } catch (error) {
      if (error instanceof Error) {
        throw invalidSignerState(`Invalid IP address or user agent: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validates signer signing data
   * @param signer - The signer to validate
   * @param signingData - Signing data for validation
   * @throws {SignatureError} When signing validation fails
   * @returns void
   */
  static validateSigningData(
    signer: Signer, 
    signingData: {
      signatureHash: string;
      documentHash: string;
      algorithm: string;
      timestamp: Date;
    }
  ): void {
    const { signatureHash, documentHash, algorithm, timestamp } = signingData;

    if (signer.hasSigned()) {
      throw signerAlreadySigned('Signer has already signed');
    }

    if (signer.hasDeclined()) {
      throw signerAlreadyDeclined('Signer has already declined');
    }

    if (!signer.hasConsent()) {
      throw invalidSignerState('Signer must give consent before signing');
    }

    if (!signatureHash || typeof signatureHash !== 'string') {
      throw invalidSignerState('Signature hash is required');
    }

    if (!documentHash || typeof documentHash !== 'string') {
      throw invalidSignerState('Document hash is required');
    }

    if (!algorithm || typeof algorithm !== 'string') {
      throw invalidSignerState('Signing algorithm is required');
    }

    if (!timestamp || timestamp > new Date()) {
      throw invalidSignerState('Invalid signing timestamp');
    }
  }

  /**
   * Validates signer decline data
   * @param signer - The signer to validate
   * @param declineData - Decline data for validation
   * @throws {SignatureError} When decline validation fails
   * @returns void
   */
  static validateDeclineData(
    signer: Signer, 
    declineData: {
      reason?: string;
      timestamp: Date;
      ipAddress: string;
      userAgent: string;
    }
  ): void {
    const { timestamp, ipAddress, userAgent } = declineData;

    console.log('[SignerValidator.validateDeclineData] Starting validation', {
      signerId: signer.getId().getValue(),
      hasSigned: signer.hasSigned(),
      hasDeclined: signer.hasDeclined(),
      timestamp: timestamp?.toISOString(),
      ipAddress,
      userAgent
    });

    if (signer.hasSigned()) {
      console.log('[SignerValidator.validateDeclineData] Signer has already signed');
      throw signerAlreadySigned('Signer has already signed');
    }

    if (signer.hasDeclined()) {
      console.log('[SignerValidator.validateDeclineData] Signer has already declined');
      throw signerAlreadyDeclined('Signer has already declined');
    }

    if (!timestamp || timestamp > new Date()) {
      console.log('[SignerValidator.validateDeclineData] Invalid timestamp', {
        timestamp: timestamp?.toISOString(),
        now: new Date().toISOString()
      });
      throw invalidSignerState('Invalid decline timestamp');
    }

    try {
      console.log('[SignerValidator.validateDeclineData] Validating IP and UserAgent', {
        ipAddress,
        userAgent,
        maxLength: 500
      });
      validateIpAddressAndUserAgent(ipAddress, userAgent, 500);
      console.log('[SignerValidator.validateDeclineData] IP and UserAgent validation passed');
    } catch (error) {
      console.error('[SignerValidator.validateDeclineData] IP/UserAgent validation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress,
        userAgent
      });
      if (error instanceof Error) {
        throw invalidSignerState(`Invalid IP address or user agent: ${error.message}`);
      }
      throw error;
    }

    console.log('[SignerValidator.validateDeclineData] All validations passed');
  }

  /**
   * Comprehensive signer validation
   * @param signer - The signer to validate
   * @param operation - The operation being performed
   * @param operationData - Data specific to the operation
   * @throws {SignatureError} When any validation fails
   * @returns void
   */
  static validateForOperation(
    signer: Signer,
    operation: SignerOperation,
    operationData?: any
  ): void {
    switch (operation) {
      case SignerOperation.SIGN:
        this.validateCanSign(signer);
        if (operationData) {
          this.validateSigningData(signer, operationData);
        }
        break;

      case SignerOperation.DECLINE:
        this.validateCanDecline(signer);
        if (operationData) {
          this.validateDeclineData(signer, operationData);
        }
        break;

      case SignerOperation.REMOVE:
        this.validateCanBeRemoved(signer);
        break;

      case SignerOperation.ADD:
        // ADD operation doesn't require signer validation
        break;

      default:
        throw invalidSignerState(`Unknown operation: ${operation}`);
    }
  }
}
