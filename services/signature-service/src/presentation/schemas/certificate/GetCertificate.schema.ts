/**
 * @file GetCertificate.schema.ts
 * @summary Zod schemas for the GetCertificate endpoint
 * 
 * @description
 * Defines input validation schemas for the certificate retrieval endpoint.
 * Handles path parameters and query parameters for pagination.
 */

import { z } from "zod";

/**
 * Path parameters for GET /envelopes/:envelopeId/certificate
 */
export const GetCertificatePath = z.object({
  envelopeId: z.string().min(1, "Envelope ID is required"),
});

/**
 * Query parameters for certificate retrieval with pagination
 */
export const GetCertificateQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

/**
 * Response schema for certificate data
 */
export const GetCertificateResponse = z.object({
  envelopeId: z.string(),
  status: z.enum(["draft", "sent", "completed", "cancelled", "declined"]),
  events: z.array(z.object({
    id: z.string(),
    occurredAt: z.string(),
    type: z.string(),
    actor: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
    prevHash: z.string().optional(),
    hash: z.string().optional(),
  })),
  chainValid: z.boolean(),
  nextCursor: z.string().optional(),
});

export type GetCertificatePathType = z.infer<typeof GetCertificatePath>;
export type GetCertificateQueryType = z.infer<typeof GetCertificateQuery>;
export type GetCertificateResponseType = z.infer<typeof GetCertificateResponse>;






