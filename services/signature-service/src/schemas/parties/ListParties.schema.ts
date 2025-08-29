/**
 * @file ListParties.schema.ts
 * @summary Zod schemas for the ListParties endpoint
 * 
 * @description
 * Defines input validation schemas for listing parties of an envelope.
 * Handles path parameters and query parameters for pagination and filtering.
 */

import { z } from "zod";

/**
 * Path parameters for GET /envelopes/:envelopeId/parties
 */
export const ListPartiesPath = z.object({
  envelopeId: z.string().min(1, "Envelope ID is required"),
});

/**
 * Query parameters for listing parties with pagination and filtering
 */
export const ListPartiesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
  role: z.enum(["signer", "viewer", "delegate"]).optional(),
  status: z.enum(["pending", "invited", "signed", "declined"]).optional(),
  email: z.string().email().optional(),
});

/**
 * Response schema for party listing
 */
export const ListPartiesResponse = z.object({
  parties: z.array(z.object({
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
  })),
  meta: z.object({
    limit: z.number(),
    nextCursor: z.string().optional(),
    total: z.number().optional(),
  }),
});

export type ListPartiesPathType = z.infer<typeof ListPartiesPath>;
export type ListPartiesQueryType = z.infer<typeof ListPartiesQuery>;
export type ListPartiesResponseType = z.infer<typeof ListPartiesResponse>;


