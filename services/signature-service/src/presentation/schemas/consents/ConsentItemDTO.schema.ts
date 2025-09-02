/**
 * @file ConsentItemDTO.schema.ts
 * @summary Zod schema for the Consent item persisted in DynamoDB.
 *
 * This is the *persistence DTO* (flat, single-table fields). It is validated
 * at repository boundaries so we never trust raw DDB shapes.
 */

import { CONSENT_STATUSES, CONSENT_TYPES } from "../../../domain/values/enums";
import { z } from "@lawprotect/shared-ts";

export const ConsentItemDTOSchema = z.object({
  pk: z.string(),
  sk: z.string(),
  type: z.literal("Consent"),
  envelopeId: z.string(),
  tenantId: z.string(),
  consentId: z.string(),
  partyId: z.string(),
  consentType: z.enum(CONSENT_TYPES),
  status: z.enum(CONSENT_STATUSES),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ConsentItemDTO = z.infer<typeof ConsentItemDTOSchema>;
