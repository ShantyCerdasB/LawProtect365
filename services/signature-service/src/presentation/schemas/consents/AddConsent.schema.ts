// consents/AddConsent.schema.ts
import { z, ISODateStringSchema } from "@lawprotect/shared-ts";
import {
  EnvelopePath,
  ConsentCore,
  ConsentType,
  MetadataSchema,
} from "@/schemas/common/consent.common";
import { PartyId } from "@/schemas/common";

/** Path: /envelopes/:envelopeId/consents */
export const AddConsentPath = EnvelopePath;

/** Body */
export const AddConsentBody = z.object({
  partyId:     PartyId,
  consentType: ConsentType,
  metadata:    MetadataSchema.optional(),
  expiresAt:   ISODateStringSchema.optional(),
});

/** Response
 * Nota: si en tu API `status` puede venir omitido al crear,
 * lo hacemos opcional sobrescribiendo el del core.
 */
export const AddConsentResponse = ConsentCore
  .omit({ status: true })
  .extend({ status: ConsentCore.shape.status.optional() });

export type AddConsentPathType = z.infer<typeof AddConsentPath>;
export type AddConsentBodyType = z.infer<typeof AddConsentBody>;
export type AddConsentResponseType = z.infer<typeof AddConsentResponse>;




