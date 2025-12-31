/**
 * @fileoverview SignerInfo - Signer information for PDF signatures
 * @summary Information about the signer for signature metadata
 * @description Contains signer details that will be embedded in PDF signature metadata
 * following eSign/UETA requirements for signature attribution.
 */

/**
 * Signer information for PDF signature metadata
 * @description Contains all information about the signer that will be embedded
 * in the PDF signature dictionary for legal compliance and verification purposes.
 */
export interface SignerInfo {
  /** Full name of the signer */
  name: string;
  /** Email address of the signer */
  email: string;
  /** Location where signature was created (optional) */
  location?: string;
  /** Reason for signing (optional) */
  reason?: string;
}

