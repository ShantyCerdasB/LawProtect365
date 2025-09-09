/**
 * @file UpdateParty.schema.ts
 * @summary Schema for updating Parties in envelopes
 * @description Zod schemas for validating Party update requests.
 * Provides type-safe validation for HTTP request path parameters and body.
 */

import { z } from "zod";

/**
 * @description Path parameters schema for updating a Party.
 */
export const UpdatePartyParams = z.object({
  tenantId: z.string().min(1, "Tenant ID is required").max(255, "Tenant ID too long"),
  envelopeId: z.string().min(1, "Envelope ID is required").max(255, "Envelope ID too long"),
  partyId: z.string().min(1, "Party ID is required").max(255, "Party ID too long"),
});

/**
 * @description Request body schema for updating a Party.
 */
export const UpdatePartyBody = z.object({
  name: z.string().min(1, "Name cannot be empty").max(255, "Name too long").optional(),
  email: z.string().email("Invalid email format").max(255, "Email too long").optional(),
  role: z.enum(["signer", "approver", "viewer"], {
    errorMap: () => ({ message: "Role must be signer, approver, or viewer" }),
  }).optional(),
  sequence: z.number().int().positive("Sequence must be a positive integer").optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

/**
 * @description Type for UpdateParty path parameters.
 */
export type UpdatePartyParams = z.infer<typeof UpdatePartyParams>;

/**
 * @description Type for UpdateParty request body.
 */
export type UpdatePartyBody = z.infer<typeof UpdatePartyBody>;






