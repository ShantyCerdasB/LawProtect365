import type {
  ConsentStatus,
  ConsentType,
  ConsentCreateFields,
  ConsentUpdateFields,
} from "@/domain/values/enums";

import type { WithTimestamps, WithMetadata, EnvelopeScoped } from "@/domain/Types/Common";

export type ConsentRecord =
  & EnvelopeScoped
  & WithTimestamps
  & WithMetadata
  & {
    consentId: string;
    partyId: string;
    consentType: ConsentType;
    status: ConsentStatus;
    expiresAt?: string;
  };

// Payloads sin repetir shapes (usando los tipos-unión de campos)
export type ConsentCreate =
  Pick<ConsentRecord, ConsentCreateFields>
  & { consentId: string; createdAt?: string };

export type ConsentUpdate =
  Partial<Pick<ConsentRecord, ConsentUpdateFields>>
  & { updatedAt?: string };
