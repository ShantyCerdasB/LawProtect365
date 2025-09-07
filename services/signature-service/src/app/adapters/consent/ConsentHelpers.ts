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
 * @summary Updates a consent record with audit logging
 * @description Centralized consent update logic with optional audit logging
 * 
 * @param consentsRepo - Consent repository
 * @param auditService - Optional audit service
 * @param input - Consent update input
 * @param actorContext - Optional actor context for audit
 * @returns Promise resolving to the updated consent result
 */
export async function updateConsentWithAudit(
  consentsRepo: ConsentCommandRepo,
  auditService: ConsentAuditService | undefined,
  input: any,
  actorContext?: ActorContext
): Promise<any> {
  const changes: any = {
    updatedAt: asISO(nowIso()),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.expiresAt !== undefined && { expiresAt: asISOOpt(input.expiresAt) }),
    ...(input.metadata !== undefined && { metadata: input.metadata }),
  };

  const row = await consentsRepo.update(
    { envelopeId: input.envelopeId, consentId: input.consentId },
    changes
  );

  const result = mapRowToUpdateResult(row);

  // ✅ AUDIT: Log consent update if audit service available
  if (auditService && actorContext) {
    await auditService.logConsentUpdate({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
      actor: actorContext,
    }, {
      consentId: input.consentId,
      previousStatus: row.status,
      newStatus: input.status || row.status,
      reason: "manual_update",
      metadata: {
        changes: {
          status: input.status,
          expiresAt: input.expiresAt,
          metadata: input.metadata,
        },
        previousStatus: row.status,
        previousExpiresAt: row.expiresAt,
        previousMetadata: row.metadata,
      },
    });
  }

  return result;
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

/**
 * @summary Maps consent row to update result format
 * @description Centralized mapping function for consent update results
 * 
 * @param row - Consent row from repository
 * @returns Mapped consent update result
 */
function mapRowToUpdateResult(row: any): any {
  return {
    id: row.consentId,
    envelopeId: row.envelopeId,
    partyId: row.partyId,
    type: row.consentType,
    status: row.status,
    metadata: row.metadata,
    expiresAt: row.expiresAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * @summary Centralized consent submission with audit logging
 * @description Handles consent submission and audit logging in a reusable way
 * 
 * @param consentsRepo - Consent repository
 * @param auditService - Audit service (optional)
 * @param input - Submit consent input
 * @param actorContext - Actor context (optional)
 * @param previousConsent - Previous consent state (optional)
 * @returns Submit consent result
 */
export async function submitConsentWithAudit(
  consentsRepo: any,
  auditService: any,
  input: any,
  actorContext?: any,
  previousConsent?: any
): Promise<any> {
  const row = await consentsRepo.update(
    { envelopeId: input.envelopeId, consentId: input.consentId },
    { 
      status: "granted" as any,
      updatedAt: asISO(nowIso())
    }
  );

  const result = mapRowToSubmitResult(row);

  // ✅ AUDIT: Log consent submission if audit service available
  if (auditService && actorContext && previousConsent) {
    await auditService.logConsentUpdate({
      tenantId: previousConsent.tenantId as any, // Cast to avoid branded type issues
      envelopeId: input.envelopeId,
      actor: actorContext,
    }, {
      consentId: input.consentId,
      previousStatus: previousConsent.status,
      newStatus: "granted",
      reason: "consent_submitted",
      metadata: {
        previousStatus: previousConsent.status,
        previousMetadata: previousConsent.metadata,
        previousExpiresAt: previousConsent.expiresAt,
        submittedAt: result.submittedAt,
      },
    });
  }

  return result;
}

/**
 * @summary Centralized mapping function for consent submit results
 * @description Maps consent row to submit result format
 * 
 * @param row - Consent row from repository
 * @returns Mapped consent submit result
 */
function mapRowToSubmitResult(row: any): any {
  return {
    id: row.consentId,
    envelopeId: row.envelopeId,
    partyId: row.partyId,
    type: row.consentType,
    status: row.status,
    metadata: row.metadata,
    expiresAt: row.expiresAt,
    submittedAt: row.updatedAt,
  };
}
