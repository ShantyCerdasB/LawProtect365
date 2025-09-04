/**
 * @file CreateGlobalParty.schema.ts
 * @summary Schema for creating Global Parties (contacts)
 * @description Zod schemas for validating Global Party creation requests.
 * Provides type-safe validation for HTTP request bodies.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Request body schema for creating a Global Party.
 */
export const CreateGlobalPartyBody = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  emails: z.array(z.string().email("Invalid email format")).max(10, "Too many emails").optional(),
  phone: z.string().max(20, "Phone number too long").optional(),
  locale: z.string().max(10, "Locale too long").optional(),
  role: z.enum(["signer", "approver", "viewer"], {
    errorMap: () => ({ message: "Role must be signer, approver, or viewer" }),
  }),
  source: z.enum(["manual", "import", "api"], {
    errorMap: () => ({ message: "Source must be manual, import, or api" }),
  }),
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
 * @description Type for CreateGlobalParty request body.
 */
export type CreateGlobalPartyBody = z.infer<typeof CreateGlobalPartyBody>;


