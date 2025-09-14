/**
 * @file ValidateInvitationToken.schema.ts
 * @summary Schema for validating invitation tokens
 * @description Defines the request/response schema for invitation token validation
 */

import { z } from "zod";

/**
 * @summary Path parameters for token validation
 */
export const ValidateInvitationTokenPath = z.object({
  token: z.string().min(1, "Token is required")
});

/**
 * @summary Response schema for token validation
 */
export const ValidateInvitationTokenResponse = z.object({
  valid: z.boolean(),
  tokenId: z.string().optional(),
  envelopeId: z.string().optional(),
  partyId: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
  role: z.string().optional(),
  invitedBy: z.string().optional(),
  invitedByName: z.string().optional(),
  message: z.string().optional(),
  signByDate: z.string().optional(),
  signingOrder: z.string().optional(),
  expiresAt: z.string().optional(),
  error: z.string().optional()
});

/**
 * @summary Complete schema for token validation endpoint
 */
export const ValidateInvitationTokenSchema = {
  path: ValidateInvitationTokenPath,
  response: ValidateInvitationTokenResponse
};
