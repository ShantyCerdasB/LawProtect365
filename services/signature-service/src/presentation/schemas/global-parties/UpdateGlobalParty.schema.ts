/**
 * @file UpdateGlobalParty.schema.ts
 * @summary Schema for updating Global Parties (contacts)
 * @description Zod schemas for validating Global Party update requests.
 * Provides type-safe validation for HTTP request bodies.
 */

import { z } from "@lawprotect/shared-ts";
import { GlobalPartyCommonFields } from "./GlobalPartyCommonSchemas";

/**
 * @description Path parameters schema for updating a Global Party.
 */
export const UpdateGlobalPartyParams = z.object({
  partyId: z.string().min(1, "Party ID is required").max(255, "Party ID too long"),
});

/**
 * @description Request body schema for updating a Global Party.
 */
export const UpdateGlobalPartyBody = z.object({
  name: GlobalPartyCommonFields.name.optional(),
  email: GlobalPartyCommonFields.email.optional(),
  emails: GlobalPartyCommonFields.emails,
  phone: GlobalPartyCommonFields.phone,
  locale: GlobalPartyCommonFields.locale,
  role: GlobalPartyCommonFields.role.optional(),
  source: GlobalPartyCommonFields.source.optional(),
  status: GlobalPartyCommonFields.status.optional(),
  tags: GlobalPartyCommonFields.tags,
  attributes: GlobalPartyCommonFields.attributes,
  preferences: GlobalPartyCommonFields.preferences,
  notificationPreferences: GlobalPartyCommonFields.notificationPreferences,
});

/**
 * @description Type for UpdateGlobalParty path parameters.
 */
export type UpdateGlobalPartyParams = z.infer<typeof UpdateGlobalPartyParams>;

/**
 * @description Type for UpdateGlobalParty request body.
 */
export type UpdateGlobalPartyBody = z.infer<typeof UpdateGlobalPartyBody>;

