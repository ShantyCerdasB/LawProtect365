/**
 * @fileoverview Signing algorithm validation utilities - Shared utilities for signing algorithm validation
 * @summary Common utilities for signing algorithm security level and validation
 * @description This file provides shared utilities for signing algorithm operations
 * to ensure consistency across all microservices and avoid code duplication.
 */

import { AppError, ErrorCodes } from '../errors/index.js';
import { SecurityLevel, meetsSecurityLevel } from '../enums/SecurityLevel.js';
import { ComplianceLevel, meetsComplianceLevel } from '../enums/ComplianceLevel.js';

/**
 * Signing algorithm types
 */
export enum SigningAlgorithm {
  SHA256_RSA = 'SHA256-RSA',
  SHA384_RSA = 'SHA384-RSA',
  SHA512_RSA = 'SHA512-RSA',
  ECDSA_P256_SHA256 = 'ECDSA-P256-SHA256',
  ECDSA_P384_SHA384 = 'ECDSA-P384-SHA384',
}

/**
 * Gets the security level for a signing algorithm
 * @param algorithm - The signing algorithm
 * @returns Security level of the algorithm
 */
export function getSigningAlgorithmSecurityLevel(algorithm: SigningAlgorithm): SecurityLevel {
  switch (algorithm) {
    case SigningAlgorithm.SHA512_RSA:
    case SigningAlgorithm.ECDSA_P384_SHA384:
      return SecurityLevel.HIGH;
    case SigningAlgorithm.SHA384_RSA:
    case SigningAlgorithm.ECDSA_P256_SHA256:
      return SecurityLevel.MEDIUM;
    case SigningAlgorithm.SHA256_RSA:
      return SecurityLevel.LOW;
    default:
      return SecurityLevel.LOW;
  }
}

/**
 * Validates if an algorithm meets minimum security level
 * @param algorithm - The signing algorithm to validate
 * @param minSecurityLevel - The minimum required security level
 * @throws {AppError} When algorithm does not meet minimum security level
 * @returns void
 */
export function validateAlgorithmSecurityLevel(
  algorithm: SigningAlgorithm, 
  minSecurityLevel: SecurityLevel
): void {
  const algorithmLevel = getSigningAlgorithmSecurityLevel(algorithm);
  
  if (!meetsSecurityLevel(algorithmLevel, minSecurityLevel)) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      `Algorithm ${algorithm} does not meet minimum security level ${minSecurityLevel}`
    );
  }
}

/**
 * Validates if an algorithm is compliant with a compliance level
 * @param algorithm - The signing algorithm to validate
 * @param complianceLevel - The compliance level required
 * @throws {AppError} When algorithm does not meet compliance level
 * @returns void
 */
export function validateAlgorithmCompliance(
  algorithm: SigningAlgorithm,
  complianceLevel: ComplianceLevel
): void {
  switch (complianceLevel) {
    case ComplianceLevel.BASIC:
      // Basic compliance allows SHA-256 and above
      if (algorithm === SigningAlgorithm.SHA256_RSA || algorithm === SigningAlgorithm.ECDSA_P256_SHA256) {
        return; // Valid
      }
      break;
    case ComplianceLevel.ADVANCED:
      // Advanced compliance requires SHA-384 and above
      if (algorithm === SigningAlgorithm.SHA384_RSA || algorithm === SigningAlgorithm.ECDSA_P384_SHA384) {
        return; // Valid
      }
      break;
    case ComplianceLevel.HIGH_SECURITY:
      // High security compliance requires SHA-512 or ECDSA P-384
      if (algorithm === SigningAlgorithm.SHA512_RSA || algorithm === SigningAlgorithm.ECDSA_P384_SHA384) {
        return; // Valid
      }
      break;
  }

  throw new AppError(
    ErrorCodes.COMMON_BAD_REQUEST,
    400,
    `Algorithm ${algorithm} does not meet compliance level ${complianceLevel}`
  );
}

/**
 * Checks if a signing algorithm is valid
 * @param algorithm - The algorithm to validate
 * @returns True if the algorithm is valid
 */
export function isValidSigningAlgorithm(algorithm: string): algorithm is SigningAlgorithm {
  return Object.values(SigningAlgorithm).includes(algorithm as SigningAlgorithm);
}

/**
 * Gets all algorithms that meet a minimum security level
 * @param minSecurityLevel - The minimum security level
 * @returns Array of algorithms that meet the security level
 */
export function getAlgorithmsBySecurityLevel(minSecurityLevel: SecurityLevel): SigningAlgorithm[] {
  const allAlgorithms = Object.values(SigningAlgorithm);
  
  return allAlgorithms.filter(algorithm => {
    const algorithmLevel = getSigningAlgorithmSecurityLevel(algorithm);
    return meetsSecurityLevel(algorithmLevel, minSecurityLevel);
  });
}

/**
 * Gets all algorithms that meet a compliance level
 * @param complianceLevel - The compliance level
 * @returns Array of algorithms that meet the compliance level
 */
export function getAlgorithmsByComplianceLevel(complianceLevel: ComplianceLevel): SigningAlgorithm[] {
  const allAlgorithms = Object.values(SigningAlgorithm);
  
  return allAlgorithms.filter(algorithm => {
    try {
      validateAlgorithmCompliance(algorithm, complianceLevel);
      return true;
    } catch {
      return false;
    }
  });
}
