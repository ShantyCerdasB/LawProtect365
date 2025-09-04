/**
 * @file GlobalPartyItemDTO.schema.ts
 * @summary Zod schema for the GlobalParty item persisted in DynamoDB.
 *
 * This is the *persistence DTO* (flat, single-table fields). It is validated
 * at repository boundaries so we never trust raw DDB shapes.
 */

import { GLOBAL_PARTY_STATUSES, PARTY_ROLES, PARTY_SOURCES, AUTH_METHODS } from "../../../domain/values/enums";
import { z } from "@lawprotect/shared-ts";

export const GlobalPartyItemDTOSchema = z.object({
  pk: z.string(),
  sk: z.string(),
  type: z.literal("GlobalParty"),
  tenantId: z.string(),
  partyId: z.string(),
  name: z.string(),
  email: z.string(),
  emails: z.array(z.string()).optional(),
  phone: z.string().optional(),
  locale: z.string().optional(),
  role: z.enum(PARTY_ROLES),
  source: z.enum(PARTY_SOURCES),
  status: z.enum(GLOBAL_PARTY_STATUSES),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  attributes: z.record(z.unknown()).optional(),
  preferences: z.object({
    defaultAuth: z.enum(AUTH_METHODS),
    defaultLocale: z.string().optional(),
  }),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
  }),
  stats: z.object({
    signedCount: z.number(),
    lastSignedAt: z.string().optional(),
    totalEnvelopes: z.number(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GlobalPartyItemDTO = z.infer<typeof GlobalPartyItemDTOSchema>;
