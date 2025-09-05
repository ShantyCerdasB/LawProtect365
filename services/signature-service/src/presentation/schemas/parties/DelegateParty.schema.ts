/**
 * @file DelegateParty.schema.ts
 * @summary Zod schemas for the DelegateParty endpoint
 * 
 * @description
 * Defines input validation schemas for delegating a global party's signing authority.
 * Handles path parameters and request body validation.
 */

import { z } from "@lawprotect/shared-ts";
import { DELEGATION_STATUSES, DELEGATION_TYPES } from "../../../domain/values/enums";
import { EmailSchema } from "../../../domain/value-objects/Email";
import { PersonNameSchema } from "../../../domain/value-objects/PersonName";
import { PartyMetadataSchema } from "../../../domain/value-objects/party/PartyMetadata";

/**
 * Path parameters for POST /parties/:partyId/delegate
 */
export const DelegatePartyPath = z.object({
  partyId: z.string().min(1, "Party ID is required"),
});

/**
 * Request body for delegating a global party
 */
export const DelegatePartyBody = z.object({
  delegateEmail: EmailSchema,
  delegateName: PersonNameSchema,
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
  type: z.enum(DELEGATION_TYPES).default("temporary"),
  expiresAt: z.string().datetime().optional(),
  metadata: PartyMetadataSchema.optional(),
});

/**
 * Response schema for party delegation
 */
export const DelegatePartyResponse = z.object({
  delegationId: z.string(),
  originalPartyId: z.string(),
  delegatePartyId: z.string(),
  delegateEmail: z.string(),
  delegateName: z.string(),
  reason: z.string(),
  type: z.enum(DELEGATION_TYPES),
  status: z.enum(DELEGATION_STATUSES),
  createdAt: z.string(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type DelegatePartyPathType = z.infer<typeof DelegatePartyPath>;
export type DelegatePartyBodyType = z.infer<typeof DelegatePartyBody>;
export type DelegatePartyResponseType = z.infer<typeof DelegatePartyResponse>;
