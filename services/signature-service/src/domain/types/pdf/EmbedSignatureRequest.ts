/**
 * @fileoverview EmbedSignatureRequest - Request for embedding digital signature in PDF
 * @summary Request interface for PDF signature embedding operations
 * @description Contains all data required to embed a pre-computed KMS signature into a PDF document.
 * This interface follows the domain-driven design pattern by separating request types from service implementation.
 */

import type { SignerInfo } from './SignerInfo';

/**
 * Request for embedding digital signature in PDF
 * @description Contains all parameters needed to embed a cryptographic signature
 * that was pre-computed by AWS KMS into a PDF document structure.
 */
export interface EmbedSignatureRequest {
  /** PDF content with visual signature from frontend */
  pdfContent: Buffer;
  /** Cryptographic signature bytes from KMS (pre-computed) */
  signatureBytes: Uint8Array;
  /** Certificate chain (leaf to root) for signature verification */
  certificateChain: Uint8Array[];
  /** Signer information for signature metadata */
  signerInfo: SignerInfo;
  /** Timestamp when signature was created */
  timestamp: Date;
}

