/**
 * @fileoverview SigningAlgorithm value object - Represents a validated signing algorithm
 * @summary Encapsulates signing algorithm validation and equality logic
 * @description The SigningAlgorithm value object ensures signing algorithms are valid
 * and provides type safety for signing algorithm handling throughout the system.
 */

import { 
  BadRequestError, 
  ErrorCodes,
  SigningAlgorithm as SigningAlgorithmEnum, 
  SecurityLevel,
  validateAlgorithmSecurityLevel,
  validateAlgorithmCompliance,
  ComplianceLevel
} from '@lawprotect/shared-ts';

/**
 * SigningAlgorithm value object
 * 
 * Represents a validated signing algorithm with proper validation.
 * Ensures signing algorithms meet security and compliance requirements.
 */
export class SigningAlgorithm {
  constructor(
    private readonly algorithm: SigningAlgorithmEnum,
    allowedAlgorithms: SigningAlgorithmEnum[] = [],
    minSecurityLevel?: SecurityLevel,
    complianceLevel?: ComplianceLevel
  ) {
    if (!algorithm) {
      throw new BadRequestError('SigningAlgorithm is required', ErrorCodes.COMMON_BAD_REQUEST);
    }

    if (allowedAlgorithms.length > 0 && !allowedAlgorithms.includes(algorithm)) {
      throw new BadRequestError(
        `Algorithm ${algorithm} is not allowed. Allowed algorithms: ${allowedAlgorithms.join(', ')}`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }

    // Validate security level if specified
    if (minSecurityLevel) {
      try {
        validateAlgorithmSecurityLevel(algorithm, minSecurityLevel);
      } catch (error) {
        if (error instanceof Error) {
          throw new BadRequestError(
            `Algorithm ${algorithm} does not meet minimum security level ${minSecurityLevel}: ${error.message}`,
            ErrorCodes.COMMON_BAD_REQUEST
          );
        }
        throw error;
      }
    }

    // Validate compliance level if specified
    if (complianceLevel) {
      try {
        validateAlgorithmCompliance(algorithm, complianceLevel);
      } catch (error) {
        if (error instanceof Error) {
          throw new BadRequestError(
            `Algorithm ${algorithm} does not meet compliance level ${complianceLevel}: ${error.message}`,
            ErrorCodes.COMMON_BAD_REQUEST
          );
        }
        throw error;
      }
    }
  }

  /**
   * Creates a SigningAlgorithm from a string value
   * @param algorithm - The algorithm string
   * @param allowedAlgorithms - Optional list of allowed algorithms
   * @param minSecurityLevel - Optional minimum security level
   * @param complianceLevel - Optional compliance level
   */
  static fromString(
    algorithm: string,
    allowedAlgorithms: SigningAlgorithmEnum[] = [],
    minSecurityLevel?: SecurityLevel,
    complianceLevel?: ComplianceLevel
  ): SigningAlgorithm {
    if (!Object.values(SigningAlgorithmEnum).includes(algorithm as SigningAlgorithmEnum)) {
      throw new BadRequestError(
        `Invalid signing algorithm: ${algorithm}. Valid algorithms: ${Object.values(SigningAlgorithmEnum).join(', ')}`,
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }

    return new SigningAlgorithm(
      algorithm as SigningAlgorithmEnum,
      allowedAlgorithms,
      minSecurityLevel,
      complianceLevel
    );
  }

  /**
   * Creates a SigningAlgorithm with SHA256-RSA
   */
  static sha256Rsa(): SigningAlgorithm {
    return new SigningAlgorithm(SigningAlgorithmEnum.SHA256_RSA);
  }

  /**
   * Creates a SigningAlgorithm with SHA384-RSA
   */
  static sha384Rsa(): SigningAlgorithm {
    return new SigningAlgorithm(SigningAlgorithmEnum.SHA384_RSA);
  }

  /**
   * Creates a SigningAlgorithm with SHA512-RSA
   */
  static sha512Rsa(): SigningAlgorithm {
    return new SigningAlgorithm(SigningAlgorithmEnum.SHA512_RSA);
  }

  /**
   * Creates a SigningAlgorithm with ECDSA P-256
   */
  static ecdsaP256(): SigningAlgorithm {
    return new SigningAlgorithm(SigningAlgorithmEnum.ECDSA_P256_SHA256);
  }

  /**
   * Creates a SigningAlgorithm with ECDSA P-384
   */
  static ecdsaP384(): SigningAlgorithm {
    return new SigningAlgorithm(SigningAlgorithmEnum.ECDSA_P384_SHA384);
  }

  /**
   * Gets the algorithm value
   */
  getValue(): SigningAlgorithmEnum {
    return this.algorithm;
  }

  /**
   * Checks if this is an RSA algorithm
   */
  isRsa(): boolean {
    return this.algorithm.includes('RSA');
  }

  /**
   * Checks if this is an ECDSA algorithm
   */
  isEcdsa(): boolean {
    return this.algorithm.includes('ECDSA');
  }

  /**
   * Gets the hash algorithm part (SHA256, SHA384, SHA512)
   */
  getHashAlgorithm(): string {
    if (this.isRsa()) {
      return this.algorithm.split('-')[0]; // SHA256, SHA384, SHA512
    }
    if (this.isEcdsa()) {
      return this.algorithm.split('-')[2]; // SHA256, SHA384
    }
    return '';
  }

  /**
   * Gets the key algorithm part (RSA, ECDSA)
   */
  getKeyAlgorithm(): string {
    if (this.isRsa()) {
      return 'RSA';
    }
    if (this.isEcdsa()) {
      return 'ECDSA';
    }
    return '';
  }

  /**
   * Checks if this algorithm meets a minimum security level
   */
  meetsSecurityLevel(level: SecurityLevel): boolean {
    try {
      validateAlgorithmSecurityLevel(this.algorithm, level);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if this algorithm meets a compliance level
   */
  meetsComplianceLevel(level: ComplianceLevel): boolean {
    try {
      validateAlgorithmCompliance(this.algorithm, level);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if this SigningAlgorithm equals another SigningAlgorithm
   * @param other - Other SigningAlgorithm to compare
   * @returns true if algorithms are equal
   */
  equals(other: SigningAlgorithm): boolean {
    return this.algorithm === other.algorithm;
  }

  /**
   * Returns the string representation of the algorithm
   */
  toString(): string {
    return this.algorithm;
  }

  /**
   * Returns the JSON representation of the algorithm
   */
  toJSON(): string {
    return this.algorithm;
  }
}
