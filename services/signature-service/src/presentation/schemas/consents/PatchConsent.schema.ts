// consents/PatchConsent.schema.ts
import { z, ISODateStringSchema } from "@lawprotect/shared-ts";
import {
  EnvelopeConsentPath,
  ConsentStatus,
  ConsentCore,
  MetadataSchema,
} from "@/schemas/common/consent.common";

/** Path: /envelopes/:envelopeId/consents/:consentId */
export const PatchConsentPath = EnvelopeConsentPath;

/** Body: actualización parcial (al menos un campo) */
export const PatchConsentBody = z
  .object({
    status:    ConsentStatus.optional(),
    metadata:  MetadataSchema.optional(),
    expiresAt: ISODateStringSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/** Response */
export const PatchConsentResponse = ConsentCore;

export type PatchConsentPathType = z.infer<typeof PatchConsentPath>;
export type PatchConsentBodyType = z.infer<typeof PatchConsentBody>;
export type PatchConsentResponseType = z.infer<typeof PatchConsentResponse>;




