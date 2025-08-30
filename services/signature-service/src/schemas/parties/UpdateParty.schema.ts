/**
 * @file UpdateParty.schema.ts
 * @summary Zod schemas for the UpdateParty endpoint
 * @description Zod schemas for the UpdateParty endpoint.
 * Defines input validation schemas for updating a global party (contact).
 * Handles path parameters and request body validation for partial updates.
 */

import { z } from "zod";
import { PARTY_ROLES, PARTY_SOURCES } from "../../domain/values/enums";
import { PersonNameSchema } from "../../domain/value-objects/PersonName";
import { PartyPhoneSchema } from "../../domain/value-objects/party/PartyPhone";
import { PartyMetadataSchema } from "../../domain/value-objects/party/PartyMetadata";

/**
 * Path parameters for PATCH /parties/:partyId
 */
export const UpdatePartyPath = z.object({
  partyId: z.string().min(1, "Party ID is required"),
});

/**
 * Request body for updating a global party (partial update)
 */
export const UpdatePartyBody = z.object({
  name: PersonNameSchema.optional(),
  phone: PartyPhoneSchema.optional(),
  role: z.enum(PARTY_ROLES).optional(),
  metadata: PartyMetadataSchema.optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
  }).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

/**
 * Response schema for party update
 */
export const UpdatePartyResponse = z.object({
  partyId: z.string(),
  email: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  role: z.enum(PARTY_ROLES),
  source: z.enum(PARTY_SOURCES),
  status: z.literal("active"),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
  }).optional(),
});

export type UpdatePartyPathType = z.infer<typeof UpdatePartyPath>;
export type UpdatePartyBodyType = z.infer<typeof UpdatePartyBody>;
export type UpdatePartyResponseType = z.infer<typeof UpdatePartyResponse>;
