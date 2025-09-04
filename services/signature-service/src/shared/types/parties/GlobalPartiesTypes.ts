/**
 * @file GlobalPartiesTypes.ts
 * @summary Global Parties types and interfaces
 * @description Types and interfaces for Global Parties module
 */

import type { TenantId, PartyId } from "../../../domain/value-objects/Ids";
import type { GlobalPartyStatus, PartyRole, PartySource } from "../../../domain/values/enums";

/** Persisted DynamoDB item shape (aligned with GlobalParty entity) */
export interface DdbGlobalPartyItem {
  pk: string;
  sk: string;
  type: string;

  tenantId: TenantId;
  partyId: PartyId;

  name: string;
  email: string;
  emails?: string[];
  phone?: string;
  locale?: string;
  role: PartyRole;
  source: PartySource;
  status: GlobalPartyStatus;
  tags?: string[];
  attributes?: Record<string, unknown>;
  preferences: {
    defaultAuth: string;
  };
  notificationPreferences: {
    email: boolean;
    sms: boolean;
  };
  stats: {
    signedCount: number;
    totalEnvelopes: number;
  };

  createdAt: string;
  updatedAt: string;
}

/** Type guard for required fields in storage */
export const isDdbGlobalPartyItem = (v: unknown): v is DdbGlobalPartyItem => {
  const o = v as Partial<DdbGlobalPartyItem> | null | undefined;
  return Boolean(
    o &&
      typeof o.pk === "string" &&
      typeof o.sk === "string" &&
      o.type === "GlobalParty" &&
      typeof o.tenantId === "string" &&
      typeof o.partyId === "string" &&
      typeof o.name === "string" &&
      typeof o.email === "string" &&
      typeof o.role === "string" &&
      typeof o.source === "string" &&
      typeof o.status === "string" &&
      o.preferences &&
      typeof o.preferences.defaultAuth === "string" &&
      o.notificationPreferences &&
      typeof o.notificationPreferences.email === "boolean" &&
      typeof o.notificationPreferences.sms === "boolean" &&
      o.stats &&
      typeof o.stats.signedCount === "number" &&
      typeof o.stats.totalEnvelopes === "number" &&
      typeof o.createdAt === "string" &&
      typeof o.updatedAt === "string"
  );
};
