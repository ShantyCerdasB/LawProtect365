/**
 * @file UpdateGlobalParty.schema.ts
 * @summary Schema for updating Global Parties (contacts)
 * @description Zod schemas for validating Global Party update requests.
 * Provides type-safe validation for HTTP request bodies.
 */

import { z } from "@lawprotect/shared-ts";

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
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  email: z.string().email("Invalid email format").max(255, "Email too long").optional(),
  emails: z.array(z.string().email("Invalid email format")).max(10, "Too many emails").optional(),
  phone: z.string().max(20, "Phone number too long").optional(),
  locale: z.string().max(10, "Locale too long").optional(),
  role: z.enum(["signer", "approver", "viewer"], {
    errorMap: () => ({ message: "Role must be signer, approver, or viewer" }),
  }).optional(),
  source: z.enum(["manual", "import", "api"], {
    errorMap: () => ({ message: "Source must be manual, import, or api" }),
  }).optional(),
  status: z.enum(["active", "inactive", "deleted"], {
    errorMap: () => ({ message: "Status must be active, inactive, or deleted" }),
  }).optional(),
  tags: z.array(z.string().min(1, "Tag cannot be empty").max(50, "Tag too long"))
    .max(10, "Too many tags")
    .optional(),
  attributes: z.record(z.unknown()).optional(),
  preferences: z.object({
    defaultAuth: z.string().optional(),
    defaultLocale: z.string().optional(),
  }).optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
});

/**
 * @description Type for UpdateGlobalParty path parameters.
 */
export type UpdateGlobalPartyParams = z.infer<typeof UpdateGlobalPartyParams>;

/**
 * @description Type for UpdateGlobalParty request body.
 */
export type UpdateGlobalPartyBody = z.infer<typeof UpdateGlobalPartyBody>;

