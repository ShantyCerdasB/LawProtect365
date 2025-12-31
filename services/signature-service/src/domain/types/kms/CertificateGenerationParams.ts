/**
 * @fileoverview CertificateGenerationParams - Parameters for certificate generation
 * @summary Interface for certificate generation request parameters
 * @description Defines the structure for requesting X.509 certificate generation
 * from KMS public keys, including subject information and validity period.
 */

/**
 * Certificate subject information
 */
export interface CertificateSubject {
  /** Common name (CN) - typically the signer's name */
  commonName: string;
  /** Organization (O) - company or organization name */
  organization: string;
  /** Organizational unit (OU) - department or division */
  organizationalUnit?: string;
  /** Country code (C) - ISO 3166-1 alpha-2 country code */
  country?: string;
  /** Email address (E) - signer's email */
  emailAddress?: string;
}

/**
 * Parameters for generating a self-signed X.509 certificate
 * @description Contains all information needed to generate a certificate from a KMS public key
 */
export interface CertificateGenerationParams {
  /** DER-encoded public key from KMS */
  publicKeyDer: Uint8Array;
  /** Certificate subject information */
  subject: CertificateSubject;
  /** Validity period in days (read from CERTIFICATE_VALIDITY_DAYS env var) */
  validityDays: number;
}

