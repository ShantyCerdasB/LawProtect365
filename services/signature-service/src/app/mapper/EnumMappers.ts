import {
  CONSENT_TYPES, CONSENT_STATUSES, DELEGATION_STATUSES,
  type ConsentType, type ConsentStatus, type DelegationStatus,
} from "@/domain/values/enums";

export const toConsentType = (t: string): ConsentType =>
  (CONSENT_TYPES as readonly string[]).includes(t) ? (t as ConsentType) : "signature";

export const toConsentStatus = (s: string): ConsentStatus =>
  (CONSENT_STATUSES as readonly string[]).includes(s) ? (s as ConsentStatus) : "pending";

export const toDelegationStatus = (s: string): DelegationStatus =>
  (DELEGATION_STATUSES as readonly string[]).includes(s) ? (s as DelegationStatus) : "pending";
