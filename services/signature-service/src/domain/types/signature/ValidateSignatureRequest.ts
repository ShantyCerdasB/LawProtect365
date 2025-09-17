/**
 * @fileoverview ValidateSignatureRequest - Request interface for signature validation
 * @summary Defines the request structure for validating digital signatures
 * @description This interface defines the complete request structure for validating
 * digital signatures, including all required fields for verification operations.
 */

import { SignatureId } from '../../value-objects/SignatureId';
import { SigningAlgorithm } from '../../enums/SigningAlgorithm';

/**
 * Request interface for validating digital signatures
 * 
 * This interface defines the complete request structure for validating
 * digital signatures. It includes all required fields for signature
 * verification operations using AWS KMS.
 */
export interface ValidateSignatureRequest {
  /**
   * Unique identifier of the signature to validate
   */
  readonly signatureId: SignatureId;

  /**
   * Hash of the document that was signed
   * Used to verify the signature was created for the correct document
   */
  readonly documentHash: string;

  /**
   * The signature data to validate
   * This is the cryptographic signature returned from KMS
   */
  readonly signature: string;

  /**
   * Cryptographic algorithm used for the signature
   * Must match the algorithm used during signature creation
   */
  readonly algorithm: SigningAlgorithm;
}
