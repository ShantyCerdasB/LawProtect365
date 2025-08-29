// common/consent.common.ts
import { z, ISODateStringSchema } from "@lawprotect/shared-ts";
import { EnvelopeId, ConsentId, PartyId } from "@/schemas/common";
import { CONSENT_STATUSES, CONSENT_TYPES } from "@/domain/values/enums";

/** Enums de dominio */
export const ConsentStatus = z.enum(CONSENT_STATUSES);
export type ConsentStatus = z.infer<typeof ConsentStatus>;

export const ConsentType = z.enum(CONSENT_TYPES);
export type ConsentType = z.infer<typeof ConsentType>;

/** Utilidades reusables */
export const MetadataSchema = z.record(z.unknown());

export const Timestamps = z.object({
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema.optional(),
  expiresAt: ISODateStringSchema.optional(),
});

/** Core de un Consent (respuesta/entidad completa) */
export const ConsentCore = z
  .object({
    consentId:  ConsentId,
    envelopeId: EnvelopeId,
    partyId:    PartyId,
    consentType: ConsentType,
    status:      ConsentStatus,
    metadata:    MetadataSchema.optional(),
  })
  .merge(Timestamps);

/** Paths reusables */
export const EnvelopePath = z.object({ envelopeId: EnvelopeId });
export const ConsentPath  = z.object({ consentId:  ConsentId });
export const EnvelopeConsentPath = EnvelopePath.merge(ConsentPath);

/** Paginación/Meta estándar */
export const PaginationMeta = z.object({
  limit: z.number(),
  nextCursor: z.string().optional(),
  total: z.number().optional(),
});

/** Query base de paginación */
export const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
