/**
 * @file DeleteParty.schema.ts
 * @summary Zod schemas for the DeleteParty endpoint
 * 
 * @description
 * Defines input validation schemas for deleting a global party record.
 * Handles path parameters validation.
 */

import { z } from "zod";

/**
 * Path parameters for DELETE /parties/:partyId
 */
export const DeletePartyPath = z.object({
  partyId: z.string().min(1, "Party ID is required"),
});

/**
 * Response schema for party deletion
 */
export const DeletePartyResponse = z.object({
  message: z.string(),
  partyId: z.string(),
  deletedAt: z.string(),
});

export type DeletePartyPathType = z.infer<typeof DeletePartyPath>;
export type DeletePartyResponseType = z.infer<typeof DeletePartyResponse>;



