/**
 * @file Party ↔ DynamoDB item mapper.
 * @description
 * Maps Party entities as child items under an Envelope.
 * PK = ENVELOPE#<envelopeId>
 * SK = PARTY#<partyId>
 */

import type { Party } from "../../../domain/entities/Party";
import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

export const PARTY_ENTITY = "Party" as const;

/** Key builders */
export const partyPk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;
export const partySk = (partyId: string): string => `PARTY#${partyId}`;

/** Persisted DynamoDB item shape */
export interface DdbPartyItem {
  pk: string;
  sk: string;
  type: typeof PARTY_ENTITY;
  partyId: string;
  envelopeId: string;
  name: string;
  email: string;
  role: Party["role"];
  status: Party["status"];
  invitedAt: string;
  signedAt?: string;
  createdAt: string;
}

/** Domain → Item */
export const toPartyItem = (src: Party): DdbPartyItem => ({
  pk: partyPk(src.envelopeId),
  sk: partySk(src.partyId),
  type: PARTY_ENTITY,
  partyId: src.partyId,
  envelopeId: src.envelopeId,
  name: src.name,
  email: src.email,
  role: src.role,
  status: src.status,
  invitedAt: src.invitedAt,
  signedAt: src.signedAt,
  createdAt: src.createdAt,
});

/** Type guard */
export const isDdbPartyItem = (v: unknown): v is DdbPartyItem => {
  const o = v as DdbPartyItem;
  return Boolean(o && typeof o.pk === "string" && o.type === PARTY_ENTITY);
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
    partyId: item.partyId,
    envelopeId: item.envelopeId,
    name: item.name,
    email: item.email,
    role: item.role,
    status: item.status,
    invitedAt: item.invitedAt,
    signedAt: item.signedAt,
    createdAt: item.createdAt,
  });
};

/** Mapper export */
export const partyItemMapper: Mapper<Party, DdbPartyItem> = {
  toDTO: toPartyItem,
  fromDTO: fromPartyItem,
};
