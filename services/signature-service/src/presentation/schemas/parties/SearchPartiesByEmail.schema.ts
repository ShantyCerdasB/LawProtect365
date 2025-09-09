/**
 * @file SearchPartiesByEmail.schema.ts
 * @summary Schema for searching Parties by email
 * @description Zod schemas for validating Party search by email requests.
 * Provides type-safe validation for HTTP request path parameters and query.
 */

import { z } from "zod";

/**
 * @description Path parameters schema for searching parties by email.
 */
export const SearchPartiesByEmailParams = z.object({
  tenantId: z.string().min(1, "Tenant ID is required").max(255, "Tenant ID too long"),
  envelopeId: z.string().min(1, "Envelope ID is required").max(255, "Envelope ID too long"),
});

/**
 * @description Query schema for searching parties by email.
 */
export const SearchPartiesByEmailQuery = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required").max(255, "Email too long"),
});

/**
 * @description Type for SearchPartiesByEmail path parameters.
 */
export type SearchPartiesByEmailParams = z.infer<typeof SearchPartiesByEmailParams>;

/**
 * @description Type for SearchPartiesByEmail query parameters.
 */
export type SearchPartiesByEmailQuery = z.infer<typeof SearchPartiesByEmailQuery>;






