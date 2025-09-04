/**
 * @file UpdateGlobalParty.schema.ts
 * @summary Update Global Party validation schema
 * @description Zod schema for validating Global Party update data
 */

import { z } from "@lawprotect/shared-ts";
import { PARTY_ROLES, GLOBAL_PARTY_STATUSES, PARTY_SOURCES } from "../../../../domain/values/enums";


/**
 * @description Schema for updating a Global Party
 */
export const UpdateGlobalPartySchema = z.object({
  partyId: z.string().min(1, "Party ID is required"),
  updates: z.object({
    name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
    email: z.string().email("Invalid email format").optional(),
    emails: z.array(z.string().email("Invalid email format")).optional(),
    phone: z.string().optional(),
    locale: z.string().optional(),
    role: z.enum(PARTY_ROLES, { message: "Invalid party role" }).optional(),
    source: z.enum(PARTY_SOURCES, { message: "Invalid party source" }).optional(),
    status: z.enum(GLOBAL_PARTY_STATUSES, { message: "Invalid party status" }).optional(),
    tags: z.array(z.string().min(1, "Tag cannot be empty").max(50, "Tag too long"))
      .max(10, "Too many tags").optional(),
    metadata: z.record(z.unknown()).optional(),
    attributes: z.record(z.unknown()).optional(),
    preferences: z.object({
      defaultAuth: z.string().min(1, "Default auth method is required").optional(),
      defaultLocale: z.string().optional(),
    }).optional(),
    notificationPreferences: z.object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
    }).optional(),
    stats: z.object({
      signedCount: z.number().int().min(0, "Signed count cannot be negative").optional(),
      lastSignedAt: z.string().datetime().optional(),
      totalEnvelopes: z.number().int().min(0, "Total envelopes cannot be negative").optional(),
    }).optional(),
  }),
});

/**
 * @description Type inference from schema
 */
export type UpdateGlobalPartySchemaType = z.infer<typeof UpdateGlobalPartySchema>;
