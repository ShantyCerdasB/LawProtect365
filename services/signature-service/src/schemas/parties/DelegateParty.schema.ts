/**
 * @file DelegateParty.schema.ts
 * @summary Request schema for delegating a party to another user.
 */

import { z } from "@lawprotect/shared-ts";

/** Body payload for delegating a party. */
export const DelegatePartyBody = z.object({
  newEmail: z.string().email(),
  reason: z.string().max(500).optional(),
});
export type DelegatePartyBody = z.infer<typeof DelegatePartyBody>;
