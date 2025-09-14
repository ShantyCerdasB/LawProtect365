/**
 * @file GlobalPartyItemDTO.mapper.ts
 * @summary Mapper functions for GlobalParty DTO ↔ Row conversion
 * @description Maps between DynamoDB DTO and domain row types for GlobalParty
 */

import type { GlobalPartyItemDTO } from "../../../presentation/schemas/global-parties/GlobalPartyItemDTO.schema";
import type { GlobalPartyExtended } from "../../../domain/types/global-parties/GlobalPartiesTypes";
import { PartyId } from "../../../domain/value-objects";

/**
 * @summary Maps DynamoDB DTO to domain row
 * @param dto - DynamoDB item DTO
 * @returns Domain row object
 */
export function dtoToGlobalPartyExtended(dto: GlobalPartyItemDTO): GlobalPartyExtended {
  return {
    partyId: dto.partyId as PartyId,
    name: dto.name,
    email: dto.email,
    emails: dto.emails,
    phone: dto.phone,
    locale: dto.locale,
    role: dto.role,
    source: dto.source,
    status: dto.status,
    tags: dto.tags,
    metadata: dto.metadata,
    attributes: dto.attributes,
    preferences: {
      defaultAuth: dto.preferences.defaultAuth as any,
      defaultLocale: dto.preferences.defaultLocale},
    notificationPreferences: {
      email: dto.notificationPreferences.email,
      sms: dto.notificationPreferences.sms},
    stats: {
      signedCount: dto.stats.signedCount,
      lastSignedAt: dto.stats.lastSignedAt,
      totalEnvelopes: dto.stats.totalEnvelopes},
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt};
}

/**
 * @summary Maps domain row to DynamoDB DTO
 * @param row - Domain row object
 * @param pk - Partition key for DynamoDB
 * @param sk - Sort key for DynamoDB
 * @returns DynamoDB item DTO
 */
export function globalPartyRowToDto(
  row: GlobalPartyExtended,
  pk: string,
  sk: string
): GlobalPartyItemDTO {
  return {
    pk,
    sk,
    type: "GlobalParty",
    partyId: row.partyId as string,
    name: row.name,
    email: row.email,
    emails: row.emails,
    phone: row.phone,
    locale: row.locale,
    role: row.role,
    source: row.source,
    status: row.status,
    tags: row.tags,
    metadata: row.metadata,
    attributes: row.attributes,
    preferences: row.preferences,
    notificationPreferences: row.notificationPreferences,
    stats: row.stats,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt};
}

