/**
 * @file CreateGlobalParty.schema.ts
 * @summary Create Global Party validation schema
 * @description Zod schema for validating Global Party creation data
 */

import { z } from "@lawprotect/shared-ts";
import { PARTY_ROLES, GLOBAL_PARTY_STATUSES, PARTY_SOURCES } from "../../../../domain/values/enums";


/**
 * @description Schema for creating a Global Party
 */
export const CreateGlobalPartySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  email: z.string().email("Invalid email format"),
  emails: z.array(z.string().email("Invalid email format")).optional(),
  phone: z.string().optional(),
  locale: z.string().optional(),
  role: z.enum(PARTY_ROLES, { message: "Invalid party role" }),
  source: z.enum(PARTY_SOURCES, { message: "Invalid party source" }),
  status: z.enum(GLOBAL_PARTY_STATUSES, { message: "Invalid party status" }),
  tags: z.array(z.string().min(1, "Tag cannot be empty").max(50, "Tag too long"))
    .max(10, "Too many tags").optional(),
  metadata: z.record(z.unknown()).optional(),
  attributes: z.record(z.unknown()).optional(),
  preferences: z.object({
    defaultAuth: z.string().min(1, "Default auth method is required"),
    defaultLocale: z.string().optional(),
  }),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
  }),
  stats: z.object({
    signedCount: z.number().int().min(0, "Signed count cannot be negative").default(0),
    lastSignedAt: z.string().datetime().optional(),
    totalEnvelopes: z.number().int().min(0, "Total envelopes cannot be negative").default(0),
  }).default({
    signedCount: 0,
    totalEnvelopes: 0,
  }),
});

/**
 * @description Type inference from schema
 */
export type CreateGlobalPartySchemaType = z.infer<typeof CreateGlobalPartySchema>;
