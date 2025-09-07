/**
 * @file GlobalPartyCommonSchemas.ts
 * @summary Common schemas for Global Parties
 * @description Shared Zod schemas for Global Party operations to avoid duplication
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @summary Common field schemas for Global Parties
 * @description Reusable field definitions to avoid duplication between create/update schemas
 */
export const GlobalPartyCommonFields = {
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
  status: z.enum(["active", "inactive", "deleted"], {
    errorMap: () => ({ message: "Status must be active, inactive, or deleted" }),
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
} as const;
