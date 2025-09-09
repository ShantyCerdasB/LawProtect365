/**
 * @file CreateGlobalParty.schema.ts
 * @summary Schema for creating Global Parties (contacts)
 * @description Zod schemas for validating Global Party creation requests.
 * Provides type-safe validation for HTTP request bodies.
 */

import { z } from "@lawprotect/shared-ts";
import { GlobalPartyCommonFields } from "./GlobalPartyCommonSchemas";

/**
 * @description Request body schema for creating a Global Party.
 */
export const CreateGlobalPartyBody = z.object({
  name: GlobalPartyCommonFields.name,
  email: GlobalPartyCommonFields.email,
  emails: GlobalPartyCommonFields.emails,
  phone: GlobalPartyCommonFields.phone,
  locale: GlobalPartyCommonFields.locale,
  role: GlobalPartyCommonFields.role,
  source: GlobalPartyCommonFields.source,
  tags: GlobalPartyCommonFields.tags,
  attributes: GlobalPartyCommonFields.attributes,
  preferences: GlobalPartyCommonFields.preferences,
  notificationPreferences: GlobalPartyCommonFields.notificationPreferences,
});

/**
 * @description Type for CreateGlobalParty request body.
 */
export type CreateGlobalPartyBody = z.infer<typeof CreateGlobalPartyBody>;








