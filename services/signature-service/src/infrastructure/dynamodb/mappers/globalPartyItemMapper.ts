/**
 * @file globalPartyItemMapper.ts
 * @summary GlobalParty ↔ DynamoDB item mapper.
 * @description
 * PK = TENANT#<tenantId>
 * SK = PARTY#<partyId>
 * Maps between GlobalParty domain entities and DynamoDB items.
 */

import type { GlobalParty } from "../../../domain/entities/GlobalParty";
import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

export const GLOBAL_PARTY_ENTITY = "GlobalParty" as const;

/** Key builders */
export const globalPartyPk = (tenantId: string): string => `TENANT#${tenantId}`;
export const globalPartySk = (partyId: string): string => `PARTY#${partyId}`;

/** Persisted DynamoDB item shape (aligned with `GlobalParty`) */
export interface DdbGlobalPartyItem {
  pk: string;
  sk: string;
  type: typeof GLOBAL_PARTY_ENTITY;

  tenantId: string;
  partyId: string;

  name: string;
  email: string;
  phone?: string;
  role: GlobalParty["role"];
  source: GlobalParty["source"];
  status: GlobalParty["status"];

  metadata?: Record<string, unknown>;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
  };

  createdAt: string;
  updatedAt: string;
}

/** Domain → Item (without writing `undefined`) */
export const toGlobalPartyItem = (src: GlobalParty): DdbGlobalPartyItem => ({
  pk: globalPartyPk(src.tenantId),
  sk: globalPartySk(src.id),
  type: GLOBAL_PARTY_ENTITY,

  tenantId: src.tenantId,
  partyId: src.id,

  name: src.name,
  email: src.email,
  ...(src.phone !== undefined ? { phone: src.phone } : {}),
  role: src.role,
  source: src.source,
  status: src.status,

  ...(src.metadata !== undefined ? { metadata: src.metadata } : {}),
  notificationPreferences: src.notificationPreferences,

  createdAt: src.createdAt,
  updatedAt: src.updatedAt,
});

/** Type guard for required fields in storage */
export const isDdbGlobalPartyItem = (v: unknown): v is DdbGlobalPartyItem => {
  const o = v as Partial<DdbGlobalPartyItem> | null | undefined;
  return Boolean(
    o &&
      typeof o.pk === "string" &&
      typeof o.sk === "string" &&
      o.type === GLOBAL_PARTY_ENTITY &&
      typeof o.tenantId === "string" &&
      typeof o.partyId === "string" &&
      typeof o.name === "string" &&
      typeof o.email === "string" &&
      typeof o.role === "string" &&
      typeof o.source === "string" &&
      typeof o.status === "string" &&
      o.notificationPreferences &&
      typeof o.notificationPreferences.email === "boolean" &&
      typeof o.notificationPreferences.sms === "boolean" &&
      typeof o.createdAt === "string" &&
      typeof o.updatedAt === "string"
  );
};

/** Item → Domain */
export const fromGlobalPartyItem = (item: unknown): GlobalParty => {
  if (!isDdbGlobalPartyItem(item)) {
    throw new BadRequestError(
      "Invalid persistence object for GlobalParty",
      ErrorCodes.COMMON_BAD_REQUEST,
      { item }
    );
  }

  return {
    id: item.partyId, // Map partyId from DB to id in domain
    tenantId: item.tenantId,
    name: item.name,
    email: item.email,
    phone: item.phone,
    role: item.role,
    source: item.source,
    status: item.status,
    metadata: item.metadata as any, // Cast to avoid branded type issues
    notificationPreferences: item.notificationPreferences,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

/** Mapper instance */
export const globalPartyItemMapper: Mapper<GlobalParty, DdbGlobalPartyItem> = {
  toDTO: toGlobalPartyItem,
  fromDTO: fromGlobalPartyItem,
};
