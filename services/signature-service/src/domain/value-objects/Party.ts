import { z } from "@lawprotect/shared-ts";
import { PARTY_ROLES } from "../values/enums";

/**
 * Party roles within an envelope.
 */
export const PartyRoleSchema = z.enum(PARTY_ROLES);
export type PartyRole = z.infer<typeof PartyRoleSchema>;

/**
 * Positive sequence number used for signing order.
 */
export const SequenceNumberSchema = z.number().int().positive();
export type SequenceNumber = z.infer<typeof SequenceNumberSchema>;
