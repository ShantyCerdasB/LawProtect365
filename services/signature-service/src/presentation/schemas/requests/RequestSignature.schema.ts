/**
 * @file RequestSignature.schema.ts
 * @summary Request schema for requesting signatures.
 * @description Defines the request body structure for requesting signatures from specific parties.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Body payload for requesting signatures.
 * Contains party ID and optional message and channel for signature request.
 */
export const RequestSignatureBody = z.object({
  /** The party ID to request signature from. */
  partyId: z.string().uuid("Party ID must be a valid UUID"),
  /** Optional custom message for the signature request. */
  message: z.string().max(500, "Message must be 500 characters or less").optional(),
  /** Optional channel for sending the signature request (email, sms). */
  channel: z.enum(["email", "sms"]).optional(),
});

export type RequestSignatureBody = z.infer<typeof RequestSignatureBody>;

