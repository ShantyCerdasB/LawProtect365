/**
 * @file SignatureContext.schema.ts
 * @summary Zod schema for SignatureContext validation
 * @description Provides runtime validation for signature context data
 */

import { z } from "zod";

/**
 * @summary Zod schema for SignatureContext validation
 * @description Validates all required fields for signature context
 */
export const SignatureContextSchema = z.object({
  signerEmail: z.string().email("Invalid signer email format"),
  signerName: z.string().min(1, "Signer name is required"),
  signerId: z.string().min(1, "Signer ID is required"),
  
  ipAddress: z.string().ip("Invalid IP address format"),
  userAgent: z.string().min(1, "User agent is required"),
  timestamp: z.string().datetime("Invalid timestamp format"),
  
  consentGiven: z.boolean(),
  consentTimestamp: z.string().datetime("Invalid consent timestamp format"),
  consentText: z.string().min(1, "Consent text is required"),
  
  invitedBy: z.string().email("Invalid invited by email format").optional(),
  invitedByName: z.string().min(1, "Invited by name is required").optional(),
  invitationMessage: z.string().optional(),
  
  envelopeId: z.string().min(1, "Envelope ID is required"),
  documentDigest: z.string().min(1, "Document digest is required"),
  documentHashAlgorithm: z.string().min(1, "Document hash algorithm is required"),
  
  signingAlgorithm: z.string().min(1, "Signing algorithm is required"),
  kmsKeyId: z.string().min(1, "KMS key ID is required")
});

/**
 * @summary TypeScript type inferred from SignatureContext schema
 */
export type SignatureContextType = z.infer<typeof SignatureContextSchema>;
