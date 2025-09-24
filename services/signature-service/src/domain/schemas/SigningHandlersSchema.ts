/**
 * @fileoverview SigningHandlersSchema - Zod schemas for signing handlers validation
 * @summary Validation schemas for signing handlers requests and responses
 * @description The SigningHandlersSchema provides Zod validation schemas for signing handlers
 * including document signing, viewing, and declining operations with invitation tokens.
 */

import { z, UuidV4, NonEmptyStringSchema } from '@lawprotect/shared-ts';

/**
 * Schema for document signing request (supports both authenticated users and invitation tokens)
 * Simplified to only include user-provided data - orchestrator handles the rest
 */
export const SignDocumentRequestSchema = z.object({
  // For invitation token users
  invitationToken: z.string().optional(),
  
  // For authenticated users (when no invitation token)
  envelopeId: UuidV4.optional(),
  signerId: UuidV4.optional(),
  
  // Consent data (required for all cases)
  consent: z.object({
    given: z.boolean(),
    timestamp: z.string().datetime(),
    text: z.string(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    country: z.string().optional(),
  })
}).refine(
  (data) => data.invitationToken || (data.envelopeId && data.signerId),
  {
    message: "Either invitationToken or (envelopeId and signerId) must be provided",
    path: ["invitationToken"]
  }
).refine(
  (data) => data.consent?.given === true,
  {
    message: 'Consent must be given',
    path: ['consent', 'given']
  }
);

/**
 * Schema for document viewing request (invitation token only)
 */
export const ViewDocumentRequestSchema = z.object({
  invitationToken: z.string().min(1, 'Invitation token is required')
});

/**
 * Schema for signer decline request (invitation token only)
 */
export const DeclineSignerRequestSchema = z.object({
  invitationToken: z.string().min(1, 'Invitation token is required'),
  reason: z.string().min(1, 'Decline reason is required').max(500, 'Decline reason must be less than 500 characters'),
  metadata: z.object({
    ipAddress: z.string().ip(),
    userAgent: z.string(),
    timestamp: z.string().datetime()
  }).optional()
});

/**
 * Schema for invitation token path parameter
 */
export const InvitationTokenPathSchema = z.object({
  invitationToken: z.string().min(1, 'Invitation token is required')
});

/**
 * Schema for sign document response
 */
export const SignDocumentResponseSchema = z.object({
  message: z.string(),
  signature: z.object({
    id: UuidV4,
    signerId: UuidV4,
    envelopeId: UuidV4,
    signedAt: z.string().datetime(),
    algorithm: NonEmptyStringSchema,
    hash: z.string()
  }),
  envelope: z.object({
    id: UuidV4,
    status: z.string(),
    progress: z.number()
  })
});

/**
 * Schema for view document response
 */
export const ViewDocumentResponseSchema = z.object({
  document: z.object({
    id: z.string(),
    envelopeId: UuidV4,
    signerId: UuidV4,
    viewUrl: z.string().url(),
    expiresAt: z.string().datetime(),
    filename: z.string(),
    contentType: z.string(),
    size: z.number()
  }),
  signer: z.object({
    id: UuidV4,
    email: z.string().email(),
    fullName: z.string(),
    status: z.string()
  }),
  envelope: z.object({
    id: UuidV4,
    title: z.string(),
    status: z.string(),
    signingOrder: z.string()
  })
});

/**
 * Schema for decline signer response
 */
export const DeclineSignerResponseSchema = z.object({
  message: z.string(),
  decline: z.object({
    signerId: UuidV4,
    envelopeId: UuidV4,
    reason: z.string(),
    declinedAt: z.string().datetime(),
    envelopeStatus: z.string()
  })
});

/**
 * Type inference from schemas
 */
export type SignDocumentRequest = z.infer<typeof SignDocumentRequestSchema>;
export type ViewDocumentRequest = z.infer<typeof ViewDocumentRequestSchema>;
export type DeclineSignerRequest = z.infer<typeof DeclineSignerRequestSchema>;
export type InvitationTokenPath = z.infer<typeof InvitationTokenPathSchema>;
export type SignDocumentResponse = z.infer<typeof SignDocumentResponseSchema>;
export type ViewDocumentResponse = z.infer<typeof ViewDocumentResponseSchema>;
export type DeclineSignerResponse = z.infer<typeof DeclineSignerResponseSchema>;
