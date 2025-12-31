/**
 * @fileoverview Pkcs7BuildParams - Parameters for building PKCS#7 SignedData structures
 * @summary Type definition for PKCS#7 SignedData construction parameters
 * @description
 * Defines the parameters required to build a PKCS#7/CMS SignedData structure
 * for embedding in PDF documents. Includes signature bytes, certificate chain,
 * signer metadata, timestamp, and document hash.
 */

import type { SignerInfo } from './SignerInfo';

/**
 * Parameters for building PKCS#7 SignedData structure
 * @description Contains all data needed to construct a valid PKCS#7 SignedData
 * structure according to RFC 5652 for PDF digital signatures.
 */
export interface Pkcs7BuildParams {
  /** Pre-computed signature bytes from KMS */
  signatureBytes: Uint8Array;
  /** Certificate chain (leaf to root) in DER format */
  certificateChain: Uint8Array[];
  /** Signer information (name, email, etc.) */
  signerInfo: SignerInfo;
  /** Timestamp when the document was signed */
  timestamp: Date;
  /** SHA-256 hash of the document content */
  documentHash: Uint8Array;
}

