/**
 * @file PatchParty.schema.ts
 * @summary Zod schemas for the PatchParty endpoint
 * 
 * @description
 * Defines input validation schemas for updating a party record.
 * Handles path parameters and request body validation for partial updates.
 */

import { z } from "zod";

/**
 * Path parameters for PATCH /envelopes/:envelopeId/parties/:partyId
 */
export const PatchPartyPath = z.object({
  envelopeId: z.string().min(1, "Envelope ID is required"),
  partyId: z.string().min(1, "Party ID is required"),
});

/**
 * Request body for patching a party (partial update)
 */
export const PatchPartyBody = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  role: z.enum(["signer", "viewer", "delegate"]).optional(),
  order: z.number().int().min(1, "Order must be at least 1").optional(),
  status: z.enum(["pending", "invited", "signed", "declined"]).optional(),
  metadata: z.record(z.unknown()).optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
  }).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

/**
 * Response schema for party update
 */
export const PatchPartyResponse = z.object({
  partyId: z.string(),
  envelopeId: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(["signer", "viewer", "delegate"]),
  order: z.number().optional(),
  status: z.enum(["pending", "invited", "signed", "declined"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
  }).optional(),
});

export type PatchPartyPathType = z.infer<typeof PatchPartyPath>;
export type PatchPartyBodyType = z.infer<typeof PatchPartyBody>;
export type PatchPartyResponseType = z.infer<typeof PatchPartyResponse>;
