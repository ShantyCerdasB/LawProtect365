import type { TenantId, EnvelopeId, PartyId, UserId } from "@/domain/value-objects/Ids";

export const toTenantId   = (s: string) => s as unknown as TenantId;
export const toEnvelopeId = (s: string) => s as unknown as EnvelopeId;
export const toPartyId    = (s: string) => s as unknown as PartyId;
export const toUserId     = (s: string) => s as unknown as UserId;
