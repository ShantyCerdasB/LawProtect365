/**
 * @file ConsentHelpers.ts
 * @summary Helper functions for consent operations
 * @description Common helper functions to eliminate code duplication in consent adapters and services
 */

import type { ConsentCommandRepo } from "../../../shared/types/consent/AdapterDependencies";
import type { ConsentAuditService } from "../../services/Consent/ConsentAuditService";
import type { CreateConsentAppInput, CreateConsentAppResult } from "../../../shared/types/consent/AppServiceInputs";
import type { ActorContext } from "../../../domain/entities/ActorContext";
import type { UserId } from "@lawprotect/shared-ts";
import { nowIso, asISO, asISOOpt } from "@lawprotect/shared-ts";

/**
 * @summary Creates a consent record with audit logging
 * @description Centralized consent creation logic with optional audit logging
 * 
 * @param consentsRepo - Consent repository
 * @param auditService - Optional audit service
 * @param ids - ID generator
 * @param input - Consent creation input
 * @param actorContext - Optional actor context for audit
 * @returns Promise resolving to the created consent result
 */
export async function createConsentWithAudit(
  consentsRepo: ConsentCommandRepo,
  auditService: ConsentAuditService | undefined,
  ids: { ulid(): string },
  input: CreateConsentAppInput,
  actorContext?: ActorContext
): Promise<CreateConsentAppResult> {
  const row = await consentsRepo.create({
    consentId: ids.ulid(),
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    partyId: input.partyId,
    consentType: input.type,
    status: input.status,
    metadata: input.metadata,
    expiresAt: asISOOpt(input.expiresAt),
    createdAt: asISO(nowIso()),
  });

  const result = mapConsentRowToResult(row);

  // ✅ AUDIT: Log consent creation if audit service available
  if (auditService && actorContext) {
    await auditService.logBusinessEvent({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
      actor: actorContext,
    }, {
      eventType: "consent.created",
      consentId: result.id,
      partyId: input.partyId,
      consentType: input.type,
      status: input.status,
      metadata: input.metadata,
      expiresAt: input.expiresAt,
    });
  }

  return result;
}

/**
 * @summary Logs consent deletion with audit
 * @description Centralized consent deletion audit logging
 * 
 * @param auditService - Optional audit service
 * @param input - Consent deletion input
 * @param consentDetails - Consent details for audit
 * @param actorContext - Optional actor context for audit
 */
export async function logConsentDeletionAudit(
  auditService: ConsentAuditService | undefined,
  input: { envelopeId: string; consentId: string },
  consentDetails: { tenantId: string; partyId: string; consentType: string; status: string; metadata?: any },
  actorContext?: ActorContext
): Promise<void> {
  if (auditService && actorContext && consentDetails) {
    await auditService.logBusinessEvent({
      tenantId: consentDetails.tenantId as any, // Cast to avoid branded type issues
      envelopeId: input.envelopeId,
      actor: actorContext,
    }, {
      eventType: "consent.deleted",
      consentId: input.consentId,
      partyId: consentDetails.partyId,
      consentType: consentDetails.consentType,
      status: consentDetails.status,
      metadata: consentDetails.metadata,
    });
  }
}

/**
 * @summary Creates audit context for consent operations
 * @description Centralized audit context creation with fallback to system context
 * 
 * @param tenantId - Tenant ID
 * @param envelopeId - Envelope ID
 * @param actorContext - Optional actor context
 * @returns Audit context object
 */
export function createConsentAuditContext(
  tenantId: string,
  envelopeId: string,
  actorContext?: ActorContext
) {
  return {
    tenantId,
    envelopeId,
    actor: actorContext || { 
      userId: "system" as UserId, 
      email: "system@lawprotect.com" 
    }
  };
}

/**
 * @summary Maps consent row to result format
 * @description Centralized mapping function for consent results
 * 
 * @param row - Consent row from repository
 * @returns Mapped consent result
 */
function mapConsentRowToResult(row: any): CreateConsentAppResult {
  return {
    id: row.consentId,
    envelopeId: row.envelopeId,
    partyId: row.partyId,
    type: row.consentType,
    status: row.status,
    metadata: row.metadata,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}
