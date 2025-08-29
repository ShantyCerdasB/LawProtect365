// consents/DelegateConsent.schema.ts
import { z, ISODateStringSchema, UuidV4 } from "@lawprotect/shared-ts";
import {
  EnvelopeConsentPath,
  ConsentStatus,
  MetadataSchema,
} from "@/schemas/common/consent.common";
import { PartyId } from "@/schemas/common";

export const DelegateConsentPath = EnvelopeConsentPath;

export const DelegateConsentBody = z.object({
  delegatePartyId: PartyId,
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
  expiresAt: ISODateStringSchema.optional(),
  metadata: MetadataSchema.optional(),
});

export const DelegateConsentResponse = z.object({
  delegationId: UuidV4, // si tienes UuidV4, cámbialo aquí
  consentId: DelegateConsentPath.shape.consentId,
  envelopeId: DelegateConsentPath.shape.envelopeId,
  originalPartyId: PartyId,
  delegatePartyId: PartyId,
  reason: z.string(),
  status: ConsentStatus,
  createdAt: ISODateStringSchema,
  expiresAt: ISODateStringSchema.optional(),
  metadata: MetadataSchema.optional(),
});

export type DelegateConsentPathType = z.infer<typeof DelegateConsentPath>;
export type DelegateConsentBodyType = z.infer<typeof DelegateConsentBody>;
export type DelegateConsentResponseType = z.infer<typeof DelegateConsentResponse>;

