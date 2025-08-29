/**
 * Puerto de dominio: consents (crea/lee/borra).
 * DRY: factoriza campos comunes y usa enums canónicos.
 */

import type { ConsentStatus, ConsentType } from "@/domain/values/enums";
import { ISODateString } from "@lawprotect/shared-ts";

export type ConsentKey = { envelopeId: string; consentId: string };
export type { ConsentStatus, ConsentType } from "@/domain/values/enums";

export interface ConsentCore {
  consentId: string;
  envelopeId: string;
  partyId: string;
  consentType: ConsentType;
  status: ConsentStatus;
}

export type ConsentState = ConsentCore;

export interface ConsentRecord extends ConsentCore {
  createdAt: ISODateString;
  updatedAt?: ISODateString;
  expiresAt?: ISODateString;
  metadata?: Record<string, unknown>;
}

export interface CreateConsentInput {
  tenantId: string;
  envelopeId: string;
  partyId: string;
  consentType: ConsentType;
  metadata?: Record<string, unknown>;
  expiresAt?: ISODateString;
}

export interface DeleteConsentResult {
  consentId: string;
  envelopeId: string;
  deletedAt: ISODateString;
}

export interface ConsentsPort {
  create(input: CreateConsentInput): Promise<ConsentRecord>;
  getById(envelopeId: string, consentId: string): Promise<ConsentState | null>;
  delete(envelopeId: string, consentId: string): Promise<DeleteConsentResult>;
}

