/**
 * @file Invitations.schema.ts
 * @summary Request schema for sending invitations to parties.
 */

import { z } from "@lawprotect/shared-ts";

/** Body payload for sending invitations. */
export const InvitationsBody = z.object({
  partyIds: z.array(z.string().uuid()).nonempty(),
});
export type InvitationsBody = z.infer<typeof InvitationsBody>;
