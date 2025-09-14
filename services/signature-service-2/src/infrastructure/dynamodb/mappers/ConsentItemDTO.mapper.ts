/**
 * @file ConsentItemDTO.mapper.ts
 * @summary Mapper functions for ConsentItemDTO data transformation
 * @description Provides mapping functions to convert between DynamoDB DTO format and repository row format.
 * Handles validation, parsing, and type conversion for consent item data structures.
 */

import type { ConsentRepoRow } from "../../../domain/types/consent";
import { ConsentItemDTO, ConsentItemDTOSchema } from "../../../presentation/schemas/consents/ConsentItemDTO.schema";
import { badRequest } from "../../../shared/errors";
import { asISO, asISOOpt } from "@lawprotect/shared-ts";

/**
 * @summary Parses and validates raw data as a ConsentItemDTO
 * @description Validates the shape of raw data from DynamoDB against the ConsentItemDTO schema.
 * Throws a BadRequestError if validation fails.
 * 
 * @param {unknown} raw - Raw data from DynamoDB to validate and parse
 * @returns {ConsentItemDTO} Validated consent item DTO
 * @throws {BadRequestError} When the raw data doesn't match the expected schema
 */
export const parseConsentItemDTO = (raw: unknown): ConsentItemDTO => {
  const parsed = ConsentItemDTOSchema.safeParse(raw);
  if (!parsed.success) {
    throw badRequest("Invalid Consent item shape from DynamoDB", "INPUT_TYPE_NOT_ALLOWED", {
      issues: parsed.error.issues});
  }
  return parsed.data;
};

/**
 * @summary Converts a ConsentItemDTO to a ConsentRepoRow
 * @description Maps a DynamoDB DTO to the repository row format, converting date strings
 * to branded ISODateString types for type safety.
 * 
 * @param {ConsentItemDTO} dto - Consent item DTO from DynamoDB
 * @returns {ConsentRepoRow} Repository row with proper branded types
 */
export const dtoToConsentRow = (dto: ConsentItemDTO): ConsentRepoRow => ({
  consentId: dto.consentId,
  envelopeId: dto.envelopeId,
  partyId: dto.partyId,
  consentType: dto.consentType,
  status: dto.status,
  createdAt: asISO(dto.createdAt),
  updatedAt: asISOOpt(dto.updatedAt),
  expiresAt: asISOOpt(dto.expiresAt),
  metadata: dto.metadata});

