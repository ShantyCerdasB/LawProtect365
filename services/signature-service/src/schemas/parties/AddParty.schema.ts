/**
 * @file AddParty.schema.ts
 * @summary Request schema for adding a party to an envelope.
 */

import { z } from "@lawprotect/shared-ts";

/** Body payload for adding a new party. */
export const AddPartyBody = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  role: z.enum(["signer", "viewer", "approver"]),
  order: z.number().int().positive().optional(),
});
export type AddPartyBody = z.infer<typeof AddPartyBody>;
