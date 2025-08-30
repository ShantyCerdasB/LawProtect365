/**
 * @file Invitations.schema.ts
 * @summary Request schema for sending invitations to parties.
 * @description Defines the request body structure for inviting parties to sign an envelope.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Body payload for sending invitations to parties.
 * Contains an array of party IDs to invite for signing.
 */
export const InvitationsBody = z.object({
  /** Array of party IDs to invite for signing. Must be non-empty. */
  partyIds: z.array(z.string().uuid()).nonempty("At least one party ID is required"),
});

export type InvitationsBody = z.infer<typeof InvitationsBody>;
