// @/adapters/dynamodb/mappers/partyItemMapper.ts
/**
 * Party ↔ DynamoDB item mapper.
 * PK = ENVELOPE#<envelopeId>
 * SK = PARTY#<partyId>
 */

import type { Party } from "@/domain/entities/Party";
import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

export const PARTY_ENTITY = "Party" as const;

/** Key builders */
export const partyPk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;
export const partySk = (partyId: string): string => `PARTY#${partyId}`;

/** Persisted DynamoDB item shape (alineado con `Party`) */
export interface DdbPartyItem {
  pk: string;
  sk: string;
  type: typeof PARTY_ENTITY;

  tenantId: string;
  envelopeId: string;
  partyId: string;

  name: string;
  email: string;
  role: Party["role"];
  status: Party["status"];

  invitedAt: string;
  signedAt?: string;

  sequence: number;

  createdAt: string;
  updatedAt: string;

  otpState?: Party["otpState"];
}

/** Domain → Item (sin escribir `undefined`) */
export const toPartyItem = (src: Party): DdbPartyItem => ({
  pk: partyPk(src.envelopeId),
  sk: partySk(src.partyId),
  type: PARTY_ENTITY,

  tenantId: src.tenantId,
  envelopeId: src.envelopeId,
  partyId: src.partyId,

  name: src.name,
  email: src.email,
  role: src.role,
  status: src.status,

  invitedAt: src.invitedAt,
  ...(src.signedAt !== undefined ? { signedAt: src.signedAt } : {}),

  sequence: src.sequence,

  createdAt: src.createdAt,
  updatedAt: src.updatedAt,

  ...(src.otpState !== undefined ? { otpState: src.otpState } : {}),
});

/** Type guard mínimo sobre campos requeridos en storage */
export const isDdbPartyItem = (v: unknown): v is DdbPartyItem => {
  const o = v as Partial<DdbPartyItem> | null | undefined;
  return Boolean(
    o &&
      typeof o.pk === "string" &&
      typeof o.sk === "string" &&
      o.type === PARTY_ENTITY &&
      typeof o.tenantId === "string" &&
      typeof o.envelopeId === "string" &&
      typeof o.partyId === "string" &&
      typeof o.name === "string" &&
      typeof o.email === "string" &&
      typeof o.role === "string" &&
      typeof o.status === "string" &&
      typeof o.invitedAt === "string" &&
      typeof o.sequence === "number" &&
      typeof o.createdAt === "string" &&
      typeof o.updatedAt === "string"
  );
};

/** Item → Domain */
export const fromPartyItem = (item: unknown): Party => {
  if (!isDdbPartyItem(item)) {
    throw new BadRequestError(
      "Invalid persistence object for Party",
      ErrorCodes.COMMON_BAD_REQUEST,
      { item }
    );
  }

  return Object.freeze<Party>({
    tenantId: item.tenantId,
    partyId: item.partyId,
    envelopeId: item.envelopeId,

    name: item.name,
    email: item.email,
    role: item.role,
    status: item.status,

    invitedAt: item.invitedAt,
    signedAt: item.signedAt,

    sequence: item.sequence,

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,

    otpState: item.otpState,
  });
};

/** Mapper export */
export const partyItemMapper: Mapper<Party, DdbPartyItem> = {
  toDTO: toPartyItem,
  fromDTO: fromPartyItem,
};
