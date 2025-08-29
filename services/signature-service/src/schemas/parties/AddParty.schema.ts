/**
 * @file AddParty.schema.ts
 * @summary Zod schemas for the AddParty endpoint
 * 
 * @description
 * Defines input validation schemas for adding a party to an envelope.
 * Handles path parameters and request body validation.
 */

import { z } from "zod";

/**
 * Path parameters for POST /envelopes/:envelopeId/parties
 */
export const AddPartyPath = z.object({
  envelopeId: z.string().min(1, "Envelope ID is required"),
});

/**
 * Request body for adding a party
 */
export const AddPartyBody = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  role: z.enum(["signer", "viewer", "delegate"]),
  order: z.number().int().min(1, "Order must be at least 1").optional(),
  metadata: z.record(z.unknown()).optional(),
  notificationPreferences: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
  }).optional(),
});

/**
 * Response schema for party addition
 */
export const AddPartyResponse = z.object({
  partyId: z.string(),
  envelopeId: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(["signer", "viewer", "delegate"]),
  order: z.number().optional(),
  status: z.enum(["pending", "invited", "signed", "declined"]),
  createdAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
  }).optional(),
});

export type AddPartyPathType = z.infer<typeof AddPartyPath>;
export type AddPartyBodyType = z.infer<typeof AddPartyBody>;
export type AddPartyResponseType = z.infer<typeof AddPartyResponse>;
