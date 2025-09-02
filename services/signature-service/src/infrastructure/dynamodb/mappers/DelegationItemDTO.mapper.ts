/**
 * @file DelegationItemDTO.mapper.ts
 * @summary Mapper for delegation DTO to repository row
 * @description Maps between DynamoDB DTO and repository row for delegation records
 */

import { asISO, asISOOpt } from "@lawprotect/shared-ts";
import type { DelegationRepoRow } from "../../../shared/types/delegation/DelegationTypes";

/**
 * @summary DynamoDB DTO shape for delegation items
 * @description Shape stored in DynamoDB (plain strings for timestamps)
 */
export interface DelegationItemDTO {
  pk: string;
  sk: string;
  type: "Delegation";
  tenantId: string;
  consentId: string;
  envelopeId: string;
  originalPartyId: string;
  delegatePartyId: string;
  reason?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * @summary Maps DynamoDB DTO to repository row
 * @description Converts DynamoDB DTO to standardized repository row with branded types
 *
 * @param {DelegationItemDTO} dto - DynamoDB DTO from database
 * @returns {DelegationRepoRow} Repository row with branded types
 */
export const dtoToDelegationRow = (dto: DelegationItemDTO): DelegationRepoRow => ({
  delegationId: dto.sk.replace("DELEGATION#", ""),
  tenantId: dto.tenantId,
  consentId: dto.consentId,
  envelopeId: dto.envelopeId,
  originalPartyId: dto.originalPartyId,
  delegatePartyId: dto.delegatePartyId,
  reason: dto.reason,
  status: dto.status as DelegationRepoRow["status"],
  createdAt: asISO(dto.createdAt),
  updatedAt: asISO(dto.updatedAt),
  expiresAt: asISOOpt(dto.expiresAt),
  metadata: dto.metadata,
});
