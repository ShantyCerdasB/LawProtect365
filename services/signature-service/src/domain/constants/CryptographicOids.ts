/**
 * @fileoverview CryptographicOids - Object Identifiers for cryptographic operations
 * @summary Centralized OID constants for X.509 certificates and PKCS#7 structures
 * @description
 * This module defines Object Identifiers (OIDs) used in X.509 certificates,
 * PKCS#7/CMS structures, and other cryptographic operations. OIDs are standardized
 * identifiers that uniquely identify algorithms, extensions, and attributes.
 * 
 * OIDs are technical constants that do not change and should not be in environment
 * variables. They are part of cryptographic standards and specifications.
 */

/**
 * Object Identifiers for cryptographic algorithms and extensions
 * @description Centralized OID definitions for use in certificate generation and PKCS#7 structures
 */
export const CryptographicOids = {
  /**
   * Hash Algorithm OIDs
   */
  HASH_ALGORITHMS: {
    /** SHA-256 hash algorithm (2.16.840.1.101.3.4.2.1) */
    SHA_256: '2.16.840.1.101.3.4.2.1',
  },

  /**
   * Signature Algorithm OIDs
   */
  SIGNATURE_ALGORITHMS: {
    /** ECDSA with SHA-256 (1.2.840.10045.4.3.2) */
    ECDSA_SHA_256: '1.2.840.10045.4.3.2',
  },

  /**
   * Certificate Extension OIDs
   */
  CERTIFICATE_EXTENSIONS: {
    /**
     * Microsoft custom extension for KMS public key reference
     * OID: 1.3.6.1.4.1.311.21.7
     * Used to embed KMS public key DER in certificate extensions
     */
    KMS_PUBLIC_KEY_REFERENCE: '1.3.6.1.4.1.311.21.7',
  },

  /**
   * PKCS#7/CMS Attribute OIDs
   */
  PKCS7_ATTRIBUTES: {
    /** Content type attribute (1.2.840.113549.1.9.3) */
    CONTENT_TYPE: '1.2.840.113549.1.9.3',
    /** Message digest attribute (1.2.840.113549.1.9.4) */
    MESSAGE_DIGEST: '1.2.840.113549.1.9.4',
    /** Signing time attribute (1.2.840.113549.1.9.5) */
    SIGNING_TIME: '1.2.840.113549.1.9.5',
  },

  /**
   * PKCS#7/CMS Content Type OIDs
   */
  PKCS7_CONTENT_TYPES: {
    /** id-data content type (1.2.840.113549.1.7.1) */
    ID_DATA: '1.2.840.113549.1.7.1',
  },

  /**
   * X.500 Attribute OIDs
   */
  X500_ATTRIBUTES: {
    /** Common Name (CN) (2.5.4.3) */
    COMMON_NAME: '2.5.4.3',
  },
} as const;

/**
 * Type-safe access to OID values
 */
export type HashAlgorithmOid = typeof CryptographicOids.HASH_ALGORITHMS[keyof typeof CryptographicOids.HASH_ALGORITHMS];
export type SignatureAlgorithmOid = typeof CryptographicOids.SIGNATURE_ALGORITHMS[keyof typeof CryptographicOids.SIGNATURE_ALGORITHMS];
export type CertificateExtensionOid = typeof CryptographicOids.CERTIFICATE_EXTENSIONS[keyof typeof CryptographicOids.CERTIFICATE_EXTENSIONS];





