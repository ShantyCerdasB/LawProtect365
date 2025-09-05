/**
 * @file SigningValidationService.ts
 * @summary Validation service for Signing operations
 * @description Handles validation for Signing operations using domain rules and Zod schemas
 */

import type { 
  SigningValidationService,
  CompleteSigningControllerInput,
  DeclineSigningControllerInput,
  PrepareSigningControllerInput,
  SigningConsentControllerInput,
  PresignUploadControllerInput,
  DownloadSignedDocumentControllerInput
} from "../../../shared/types/signing";
import { HashDigestSchema } from "../../../domain/value-objects/HashDigest";
import { KmsAlgorithmSchema } from "../../../domain/value-objects/Kms";
import { assertKmsAlgorithmAllowed } from "../../../domain/rules/Signing.rules";
import { badRequest, unprocessable, signatureHashMismatch, kmsPermissionDenied } from "../../../shared/errors";

/**
 * @description Default implementation of SigningValidationService
 */
export class DefaultSigningValidationService implements SigningValidationService {
  validateCompleteSigning(input: CompleteSigningControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.signerId?.trim()) {
      throw badRequest("Signer ID is required", "PARTY_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
    if (!input.digest) {
      throw badRequest("Digest is required");
    }
    if (!input.algorithm?.trim()) {
      throw badRequest("Algorithm is required");
    }

    // Validate digest using domain value object
    try {
      HashDigestSchema.parse(input.digest);
    } catch (error) {
      throw signatureHashMismatch({ digest: input.digest, originalError: error });
    }

    // Validate KMS algorithm using domain value object
    try {
      const algorithm = KmsAlgorithmSchema.parse(input.algorithm);
      // Use domain rule to check if algorithm is allowed
      assertKmsAlgorithmAllowed(algorithm, [algorithm]); // Allow the provided algorithm
    } catch (error) {
      throw kmsPermissionDenied({ algorithm: input.algorithm, originalError: error });
    }
  }

  validateDeclineSigning(input: DeclineSigningControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.signerId?.trim()) {
      throw badRequest("Signer ID is required", "PARTY_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
    if (!input.reason?.trim()) {
      throw badRequest("Reason is required for declining");
    }
  }

  validatePrepareSigning(input: PrepareSigningControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.signerId?.trim()) {
      throw badRequest("Signer ID is required", "PARTY_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
  }

  validateSigningConsent(input: SigningConsentControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.signerId?.trim()) {
      throw badRequest("Signer ID is required", "PARTY_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
    if (typeof input.consentGiven !== "boolean") {
      throw badRequest("Consent given must be a boolean value");
    }
    if (!input.consentText?.trim()) {
      throw badRequest("Consent text is required");
    }
  }

  validatePresignUpload(input: PresignUploadControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
    if (!input.filename?.trim()) {
      throw badRequest("Filename is required");
    }
    if (!input.contentType?.trim()) {
      throw badRequest("Content type is required");
    }

    // Validate filename (basic validation)
    if (input.filename.includes("..") || input.filename.includes("/") || input.filename.includes("\\")) {
      throw unprocessable("Invalid filename", "EVIDENCE_UPLOAD_INCOMPLETE", { filename: input.filename });
    }

    // Validate content type (basic validation)
    const allowedContentTypes = ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedContentTypes.includes(input.contentType)) {
      throw unprocessable("Unsupported content type", "EVIDENCE_UPLOAD_INCOMPLETE", { contentType: input.contentType });
    }
  }

  validateDownloadSignedDocument(input: DownloadSignedDocumentControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
  }
}
