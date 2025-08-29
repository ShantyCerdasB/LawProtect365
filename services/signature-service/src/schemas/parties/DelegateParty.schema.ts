/**
 * @file DelegateParty.schema.ts
 * @summary Zod schemas for the DelegateParty endpoint
 * 
 * @description
 * Defines input validation schemas for delegating a party's signing authority.
 * Handles path parameters and request body validation.
 */

import { z } from "zod";

/**
 * Path parameters for POST /envelopes/:envelopeId/parties/:partyId/delegate
 */
export const DelegatePartyPath = z.object({
  envelopeId: z.string().min(1, "Envelope ID is required"),
  partyId: z.string().min(1, "Party ID is required"),
});

/**
 * Request body for delegating a party
 */
export const DelegatePartyBody = z.object({
  delegateEmail: z.string().email("Valid delegate email is required"),
  delegateName: z.string().min(1, "Delegate name is required").max(255, "Delegate name too long"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Response schema for party delegation
 */
export const DelegatePartyResponse = z.object({
  delegationId: z.string(),
  envelopeId: z.string(),
  originalPartyId: z.string(),
  delegatePartyId: z.string(),
  delegateEmail: z.string(),
  delegateName: z.string(),
  reason: z.string(),
  status: z.enum(["pending", "accepted", "declined", "expired"]),
  createdAt: z.string(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type DelegatePartyPathType = z.infer<typeof DelegatePartyPath>;
export type DelegatePartyBodyType = z.infer<typeof DelegatePartyBody>;
export type DelegatePartyResponseType = z.infer<typeof DelegatePartyResponse>;
