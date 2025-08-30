/**
 * @file ListParties.schema.ts
 * @summary Schema for listing Parties in envelopes
 * @description Zod schemas for validating Party listing requests.
 * Provides type-safe validation for HTTP path and query parameters.
 */

import { z } from "zod";

/**
 * @description Path parameters schema for listing Parties.
 */
export const ListPartiesParams = z.object({
  envelopeId: z.string().min(1, "Envelope ID is required").max(255, "Envelope ID too long"),
});

/**
 * @description Query parameters schema for listing Parties.
 */
export const ListPartiesQuery = z.object({
  role: z.enum(["signer", "approver", "viewer"], {
    errorMap: () => ({ message: "Role must be signer, approver, or viewer" }),
  }).optional(),
  status: z.enum(["pending", "invited", "signed", "declined", "active"], {
    errorMap: () => ({ message: "Status must be pending, invited, signed, declined, or active" }),
  }).optional(),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").optional(),
  cursor: z.string().optional(),
});

/**
 * @description Type for ListParties path parameters.
 */
export type ListPartiesParams = z.infer<typeof ListPartiesParams>;

/**
 * @description Type for ListParties query parameters.
 */
export type ListPartiesQuery = z.infer<typeof ListPartiesQuery>;



