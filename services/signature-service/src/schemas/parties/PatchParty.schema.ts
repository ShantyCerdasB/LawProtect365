/**
 * @file PatchParty.schema.ts
 * @summary Request schema for patching an existing party.
 */

import { z } from "@lawprotect/shared-ts";

/** Body payload for patching a party. */
export const PatchPartyBody = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(["signer", "viewer", "approver"]).optional(),
  order: z.number().int().positive().optional(),
});
export type PatchPartyBody = z.infer<typeof PatchPartyBody>;
