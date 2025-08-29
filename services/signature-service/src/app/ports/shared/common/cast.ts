import type { TenantId, EnvelopeId, PartyId, UserId, DocumentId } from "../../../../domain/value-objects/Ids";
import { ConsentId } from "./types";


export const toTenantId   = (s: string) => s as unknown as TenantId;
export const toEnvelopeId = (s: string) => s as unknown as EnvelopeId;
export const toPartyId    = (s: string) => s as unknown as PartyId;
export const toUserId     = (s: string) => s as unknown as UserId;
export const toDocumentId = (s: string) => s as unknown as DocumentId;
export const toConsentId  = (s: string) => s as unknown as ConsentId;
