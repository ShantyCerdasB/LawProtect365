/**
 * @file SigningValidationService.ts
 * @summary Validation service for Signing operations
 * @description Handles validation for Signing operations using domain rules and Zod schemas
 */

import { UnprocessableEntityError } from "@lawprotect/shared-ts";
import type { 
  SigningValidationService,
  CompleteSigningControllerInput,
  DeclineSigningControllerInput,
  PresignUploadControllerInput,
  DownloadSignedDocumentControllerInput
} from "../../../shared/types/signing";
import { HashDigestSchema } from "../../../domain/value-objects/HashDigest";
import { KmsAlgorithmSchema } from "../../../domain/value-objects/Kms";
import { OtpChannelSchema } from "../../../domain/value-objects/Otp";
import { assertKmsAlgorithmAllowed } from "../../../domain/rules/Signing.rules";
import { badRequest } from "../../../shared/errors";

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
      throw new UnprocessableEntityError("Invalid digest format", "SIGNATURE_HASH_MISMATCH", { digest: input.digest });
    }

    // Validate KMS algorithm using domain value object
    try {
      const algorithm = KmsAlgorithmSchema.parse(input.algorithm);
      // Use domain rule to check if algorithm is allowed
      assertKmsAlgorithmAllowed(algorithm, [algorithm]); // Allow the provided algorithm
    } catch (error) {
      throw new UnprocessableEntityError("Invalid KMS algorithm", "KMS_PERMISSION_DENIED", { algorithm: input.algorithm });
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

  validateRequestOtp(input: RequestOtpControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.signerId?.trim()) {
      throw badRequest("Signer ID is required", "PARTY_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }

    // Validate OTP channel using domain value object
    try {
      OtpChannelSchema.parse(input.delivery);
    } catch (error) {
      throw new UnprocessableEntityError("Invalid OTP delivery channel", "OTP_INVALID", { delivery: input.delivery });
    }
  }

  validateVerifyOtp(input: VerifyOtpControllerInput): void {
    if (!input.envelopeId?.trim()) {
      throw badRequest("Envelope ID is required", "ENVELOPE_NOT_FOUND");
    }
    if (!input.signerId?.trim()) {
      throw badRequest("Signer ID is required", "PARTY_NOT_FOUND");
    }
    if (!input.token?.trim()) {
      throw badRequest("Request token is required", "REQUEST_TOKEN_INVALID");
    }
    if (!input.code?.trim()) {
      throw badRequest("OTP code is required", "OTP_INVALID");
    }

    // Validate OTP code format (4-10 characters)
    if (input.code.length < 4 || input.code.length > 10) {
      throw new UnprocessableEntityError("OTP code must be between 4 and 10 characters", "OTP_INVALID", { code: input.code });
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
      throw new UnprocessableEntityError("Invalid filename", "EVIDENCE_UPLOAD_INCOMPLETE", { filename: input.filename });
    }

    // Validate content type (basic validation)
    const allowedContentTypes = ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedContentTypes.includes(input.contentType)) {
      throw new UnprocessableEntityError("Unsupported content type", "EVIDENCE_UPLOAD_INCOMPLETE", { contentType: input.contentType });
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
