/**
 * @file CreateParty.schema.ts
 * @summary Schema for creating Parties in envelopes
 * @description Zod schemas for validating Party creation requests.
 * Provides type-safe validation for HTTP request bodies and path parameters.
 */

import { z } from "zod";

/**
 * @description Path parameters schema for creating a Party.
 */
export const CreatePartyParams = z.object({
  envelopeId: z.string().min(1, "Envelope ID is required").max(255, "Envelope ID too long"),
});

/**
 * @description Request body schema for creating a Party.
 */
export const CreatePartyBody = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  role: z.enum(["signer", "approver", "viewer"], {
    errorMap: () => ({ message: "Role must be signer, approver, or viewer" }),
  }),
  sequence: z.number().int().positive("Sequence must be a positive integer").optional(),
  phone: z.string().max(20, "Phone number too long").optional(),
  locale: z.string().max(10, "Locale too long").optional(),
  auth: z.object({
    methods: z.array(z.enum(["otpViaEmail", "otpViaSms"], {
      errorMap: () => ({ message: "Auth method must be otpViaEmail or otpViaSms" }),
    })).min(1, "At least one authentication method is required"),
  }).optional(),
  globalPartyId: z.string().max(255, "Global Party ID too long").optional(),
});

/**
 * @description Type for CreateParty path parameters.
 */
export type CreatePartyParams = z.infer<typeof CreatePartyParams>;

/**
 * @description Type for CreateParty request body.
 */
export type CreatePartyBody = z.infer<typeof CreatePartyBody>;
