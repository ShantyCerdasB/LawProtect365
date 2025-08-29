// consents/ListConsents.schema.ts
import { z } from "@lawprotect/shared-ts";
import {
  EnvelopePath,
  PaginationQuery,
  ConsentStatus,
  ConsentType,
  PaginationMeta,
  ConsentCore,
} from "@/schemas/common/consent.common";
import { PartyId } from "@/schemas/common";

/** Path: /envelopes/:envelopeId/consents */
export const ListConsentsPath = EnvelopePath;

/** Query: paginación + filtros de dominio */
export const ListConsentsQuery = PaginationQuery.extend({
  status: ConsentStatus.optional(),
  consentType: ConsentType.optional(),
  partyId: PartyId.optional(),
});

/** Response */
export const ListConsentsResponse = z.object({
  consents: z.array(ConsentCore),
  meta: PaginationMeta,
});

export type ListConsentsPathType = z.infer<typeof ListConsentsPath>;
export type ListConsentsQueryType = z.infer<typeof ListConsentsQuery>;
export type ListConsentsResponseType = z.infer<typeof ListConsentsResponse>;

