/**
 * @file SignatureContext.rules.ts
 * @summary Domain rules for signature context validation
 * @description Validates signature context data for legal compliance and business rules
 */

import { SignatureContextSchema } from "../value-objects/security/SignatureContext.schema";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

/**
 * @summary Validates signature context data
 * @description Ensures signature context meets legal and business requirements
 * @param context - The signature context to validate
 * @throws {BadRequestError} When context validation fails
 */
export const assertSignatureContextValid = (context: any): void => {
  // Parse and validate the context structure
  const validated = SignatureContextSchema.parse(context);
  
  // Validate that consent was given
  if (!validated.consentGiven) {
    throw new BadRequestError(
      "Signature context must include valid consent",
      ErrorCodes.COMMON_BAD_REQUEST,
      { context: validated }
    );
  }
  
  // Validate that consent timestamp is before signing timestamp
  const consentTime = new Date(validated.consentTimestamp);
  const signingTime = new Date(validated.timestamp);
  
  if (consentTime >= signingTime) {
    throw new BadRequestError(
      "Consent timestamp must be before signing timestamp",
      ErrorCodes.COMMON_BAD_REQUEST,
      { 
        consentTimestamp: validated.consentTimestamp, 
        signingTimestamp: validated.timestamp 
      }
    );
  }
  
  // Validate that consent was given within reasonable time (e.g., 24 hours)
  const timeDiff = signingTime.getTime() - consentTime.getTime();
  const maxConsentAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  if (timeDiff > maxConsentAge) {
    throw new BadRequestError(
      "Consent is too old for signing",
      ErrorCodes.COMMON_BAD_REQUEST,
      { 
        consentTimestamp: validated.consentTimestamp, 
        signingTimestamp: validated.timestamp,
        timeDiffHours: timeDiff / (60 * 60 * 1000)
      }
    );
  }
  
  // Validate that signer email matches the context
  if (validated.signerEmail !== validated.signerEmail.toLowerCase()) {
    throw new BadRequestError(
      "Signer email must be lowercase",
      ErrorCodes.COMMON_BAD_REQUEST,
      { signerEmail: validated.signerEmail }
    );
  }
  
  // Validate that IP address is not localhost for production
  if (validated.ipAddress === "127.0.0.1" || validated.ipAddress === "::1") {
    throw new BadRequestError(
      "Invalid IP address for signing",
      ErrorCodes.COMMON_BAD_REQUEST,
      { ipAddress: validated.ipAddress }
    );
  }
};

/**
 * @summary Validates that signature context is complete for legal compliance
 * @description Ensures all required fields are present for legal signature validation
 * @param context - The signature context to validate
 * @throws {BadRequestError} When context is incomplete
 */
export const assertSignatureContextComplete = (context: any): void => {
  const validated = SignatureContextSchema.parse(context);
  
  // Check for required fields
  const requiredFields = [
    'signerEmail', 'signerName', 'signerId',
    'ipAddress', 'userAgent', 'timestamp',
    'consentGiven', 'consentTimestamp', 'consentText',
    'envelopeId', 'documentDigest', 'documentHashAlgorithm',
    'signingAlgorithm', 'kmsKeyId'
  ];
  
  for (const field of requiredFields) {
    if (!validated[field as keyof typeof validated]) {
      throw new BadRequestError(
        `Missing required field: ${field}`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { missingField: field, context: validated }
      );
    }
  }
};
