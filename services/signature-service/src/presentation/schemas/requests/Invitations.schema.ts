/**
 * @file Invitations.schema.ts
 * @summary Request schema for sending invitations to parties.
 * @description Defines the request body structure for inviting parties to sign an envelope.
 */

import { z, UuidV4 } from "@lawprotect/shared-ts";

/**
 * @description Body payload for sending invitations to parties.
 * Contains party information and invitation details for signing.
 */
export const InvitationsBody = z.object({
  /** Array of party IDs to invite for signing. Must be non-empty. */
  partyIds: z.array(UuidV4).nonempty("At least one party ID is required"),
  /** Optional custom message to include in the invitation email */
  message: z.string().max(600, "Message must be 600 characters or less").optional(),
  /** Optional deadline for signing (ISO 8601 date string) */
  signByDate: z.string().datetime().optional(),
  /** Optional signing order preference - only applies when multiple parties are invited */
  signingOrder: z.enum(["owner_first", "invitees_first"]).optional(),
  /** Input information from Documents Service */
  inputs: z.object({
    /** Whether the envelope has inputs */
    hasInputs: z.boolean(),
    /** Total number of inputs */
    inputCount: z.number().int().min(0),
    /** Number of signature inputs */
    signatureInputs: z.number().int().min(0),
    /** Email addresses of assigned signers */
    assignedSigners: z.array(z.string().email()).min(0)
  })
}).refine((data) => {
  // signingOrder only applies when there are multiple parties
  if (data.signingOrder && data.partyIds.length === 1) {
    return false;
  }
  return true;
}, {
  message: "Signing order can only be specified when inviting multiple parties",
  path: ["signingOrder"]
});

export type InvitationsBody = z.infer<typeof InvitationsBody>;

