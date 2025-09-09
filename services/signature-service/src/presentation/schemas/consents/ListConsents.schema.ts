/**
 * @file ListConsents.schema.ts
 * @summary Validation schemas for listing consents
 * @description Zod schemas for GET /envelopes/:envelopeId/consents endpoint
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeIdValidationSchema as EnvelopeIdSchema, PartyIdValidationSchema as PartyIdSchema } from "@/domain/value-objects/ids";
import { ConsentTypeValidationSchema, ConsentStatusValidationSchema } from "@/domain/value-objects/consent";

/** Path: /envelopes/:envelopeId/consents */
export const ListConsentsPath = z.object({ 
  envelopeId: EnvelopeIdSchema 
});

/** Query: paginación + filtros de dominio */
export const ListConsentsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
  status: ConsentStatusValidationSchema.optional(),
  consentType: ConsentTypeValidationSchema.optional(),
  partyId: PartyIdSchema.optional(),
});

/** Response */
export const ListConsentsResponse = z.object({
  envelopeId: z.string(),
  items: z.array(z.object({
    id: z.string(),
    partyId: z.string(),
    type: z.string(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })),
  meta: z.object({
    limit: z.number(),
    nextCursor: z.string().optional(),
    total: z.number().optional(),
  }),
});

export type ListConsentsPathType = z.infer<typeof ListConsentsPath>;
export type ListConsentsQueryType = z.infer<typeof ListConsentsQuery>;
export type ListConsentsResponseType = z.infer<typeof ListConsentsResponse>;










