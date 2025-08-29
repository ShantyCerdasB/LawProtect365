import { ISODateString } from "@lawprotect/shared-ts";


export type WithTimestamps = {
  createdAt: ISODateString;
  updatedAt?: ISODateString;
};

export type WithMetadata = {
  metadata?: Record<string, unknown>;
};

export type EnvelopeScoped = { envelopeId: string };
export type TenantScoped   = { tenantId: string };

// Claves compuestas reutilizables
export type ConsentKey    = { envelopeId: string; consentId: string };
export type DelegationKey = { envelopeId: string; delegationId: string };
