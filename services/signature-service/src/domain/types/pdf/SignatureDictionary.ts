/**
 * @fileoverview SignatureDictionary - PDF signature dictionary type definitions
 * @summary Type definitions for PDF signature dictionaries according to PDF 1.7 specification
 * @description
 * Defines the structure of PDF signature dictionaries used to embed digital signatures
 * in PDF documents. The signature dictionary contains PKCS#7 SignedData, byte ranges,
 * and signer metadata according to PDF 1.7 specification (ISO 32000-1).
 */

import type { ByteRange } from './ByteRange';
import type { SignerInfo } from './SignerInfo';

/**
 * PDF signature dictionary structure according to PDF 1.7 specification
 * @description
 * Represents a complete PDF signature dictionary that defines a digital signature
 * embedded in a PDF document. Contains the cryptographic signature (PKCS#7 SignedData),
 * byte ranges defining which parts of the PDF are covered by the signature, and
 * optional metadata about the signer (location, reason, contact info).
 * 
 * Required fields:
 * - Type: Must be '/Sig' for signature dictionaries
 * - Filter: Signature handler (e.g., '/Adobe.PPKLite')
 * - SubFilter: Signature subfilter (e.g., '/ETSI.CAdES.detached')
 * - Contents: Hex-encoded PKCS#7 SignedData
 * - ByteRange: Array defining which bytes are covered by the signature
 * - M: Signing date in PDF date format
 * - Name: Signer's name
 * 
 * Optional fields:
 * - Location: Physical location where document was signed
 * - Reason: Reason for signing
 * - ContactInfo: Contact information for the signer
 */
export interface SignatureDictionary {
  /** PDF object type, must be '/Sig' for signature dictionaries */
  Type: '/Sig';
  /** Signature handler filter (e.g., '/Adobe.PPKLite') */
  Filter: '/Adobe.PPKLite';
  /** Signature subfilter format (e.g., '/ETSI.CAdES.detached' for CAdES) */
  SubFilter: '/ETSI.CAdES.detached';
  /** Hex-encoded PKCS#7 SignedData wrapped in angle brackets */
  Contents: string;
  /** Byte ranges defining which parts of PDF are covered by signature */
  ByteRange: ByteRange;
  /** Physical location where document was signed (optional) */
  Location?: string;
  /** Reason for signing the document (optional) */
  Reason?: string;
  /** Contact information for the signer, typically email (optional) */
  ContactInfo?: string;
  /** Signing date in PDF date format: D:YYYYMMDDHHmmSSOHH'mm' */
  M: string;
  /** Signer's name */
  Name: string;
}

/**
 * Parameters for building a PDF signature dictionary
 * @description
 * Contains all data required to construct a PDF signature dictionary, including
 * the cryptographic signature data, byte ranges, signer information, and timestamp.
 */
export interface SignatureDictionaryParams {
  /** DER-encoded PKCS#7 SignedData structure */
  signedDataDER: Uint8Array;
  /** Byte ranges defining which parts of PDF are covered by signature */
  byteRanges: ByteRange;
  /** Signer information (name, email, location, reason) */
  signerInfo: SignerInfo;
  /** Timestamp when the document was signed */
  timestamp: Date;
}

