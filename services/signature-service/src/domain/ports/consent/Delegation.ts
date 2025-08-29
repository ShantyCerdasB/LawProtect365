import type { DelegationStatus } from "@/domain/values/enums";
import { ISODateString } from "@lawprotect/shared-ts";

export interface DelegationRecord {
  delegationId: string;
  consentId: string;
  envelopeId: string;
  originalPartyId: string;
  delegatePartyId: string;
  reason?: string;
  status: DelegationStatus;
  createdAt: ISODateString;
  updatedAt?: ISODateString;
  expiresAt?: ISODateString;
  metadata?: Record<string, unknown>;
}

export interface CreateDelegationInput {
  tenantId: string;
  consentId: string;
  envelopeId: string;
  originalPartyId: string;
  delegatePartyId: string;
  reason?: string;
  expiresAt?: ISODateString;
  metadata?: Record<string, unknown>;
}

export interface DelegationsPort {
  create(input: CreateDelegationInput): Promise<DelegationRecord>;
}
