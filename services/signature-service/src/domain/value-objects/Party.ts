/**
 * @file Party.ts
 * @summary Party value objects for roles and sequence numbers
 * @description Party value objects for roles and sequence numbers.
 * Provides schemas for party roles within envelopes and positive sequence numbers
 * for signing order management with proper validation.
 */

import { z } from "@lawprotect/shared-ts";
import { PARTY_ROLES } from "../values/enums";

/**
 * @description Party roles schema within an envelope.
 * Validates that the role is one of the supported party roles.
 */
export const PartyRoleSchema = z.enum(PARTY_ROLES);
export type PartyRole = z.infer<typeof PartyRoleSchema>;

/**
 * @description Positive sequence number schema used for signing order.
 * Validates that the sequence number is a positive integer for ordering.
 */
export const SequenceNumberSchema = z.number().int().positive();
export type SequenceNumber = z.infer<typeof SequenceNumberSchema>;
