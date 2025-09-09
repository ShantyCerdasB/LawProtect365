/**
 * @file makeCertificateQueriesPort.ts
 * @summary Certificate queries port adapter implementation
 * @description Implements the CertificateQueriesPort interface with production-ready features
 */

import type { CertificateQueriesPort, GetCertificateQuery, GetCertificateResult } from "../../ports/certificate/CertificateQueriesPort";
import type { AuditRepository } from "../../../domain/contracts/repositories/audit";
import type { Repository } from "@lawprotect/shared-ts";
import type { EnvelopeId } from "@/domain/value-objects/ids";
import type { Envelope } from "../../../domain/entities/Envelope";
import type { CertificateValidationService } from "../../../domain/types/certificate/ServiceInterfaces";
import type { AuditEvent } from "../../../domain/value-objects/audit";
import type { PaginationCursor } from "../../../domain/value-objects/common";
import { PAGINATION_LIMITS } from "../../../domain/values/enums";

/**
 * @summary Creates a CertificateQueriesPort implementation with production-ready features
 * @param auditRepo - The audit repository for retrieving audit events
 * @param envelopesRepo - The envelope repository for retrieving envelope data
 * @param validationService - Optional validation service for query validation
 * @returns CertificateQueriesPort implementation
 */
export function makeCertificateQueriesPort(
  auditRepo: AuditRepository,
  envelopesRepo: Repository<Envelope, EnvelopeId, undefined>,
  // ✅ SERVICIOS OPCIONALES - PATRÓN REUTILIZABLE
  validationService?: CertificateValidationService
): CertificateQueriesPort {
  
  return {
    /**
     * @summary Gets certificate and audit trail for an envelope
     * @description Retrieves the certificate data and complete audit trail for an envelope
     */
    async getCertificate(query: GetCertificateQuery): Promise<GetCertificateResult | null> {
      // 1. VALIDATION (optional)
      if (validationService) {
        validationService.validateGetCertificate(query);
      }

      // 2. GET ENVELOPE
      const envelope = await envelopesRepo.getById(query.envelopeId);
      if (!envelope) {
        return null; // Return null instead of throwing error for queries
      }

      // 3. GET AUDIT EVENTS
      const auditPage = await auditRepo.listByEnvelope({
        tenantId: query.tenantId,
        envelopeId: query.envelopeId,
        limit: query.limit ?? PAGINATION_LIMITS.DEFAULT_LIMIT,
        cursor: query.cursor as PaginationCursor | undefined, // Type assertion for cursor compatibility
      });

      // 4. VALIDATE HASH CHAIN
      const chainValid = validateHashChain(auditPage.items);

      // 5. AUDIT LOGGING (optional)

      return {
        envelopeId: query.envelopeId,
        status: envelope.status,
        events: auditPage.items,
        chainValid,
        nextCursor: auditPage.meta.nextCursor,
      };
    },
  };
}

/**
 * @summary Validates the hash chain integrity for audit events
 * @description Checks if all audit events have valid hash chains for tamper detection
 * @param events - Array of audit events to validate
 * @returns True if the hash chain is valid, false otherwise
 */
export function validateHashChain(events: AuditEvent[]): boolean {
  if (events.length === 0) {
    return true;
  }

  // Sort events by occurredAt to ensure proper chronological order
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    
    // First event should not have a prevHash (it's the genesis event)
    if (i === 0 && event.prevHash) {
      return false;
    }
    
    // Subsequent events should have a prevHash that matches the previous event's hash
    if (i > 0) {
      const prevEvent = sortedEvents[i - 1];
      if (event.prevHash !== prevEvent.hash) {
        return false;
      }
    }
    
    // All events should have a hash for integrity verification
    if (!event.hash) {
      return false;
    }
  }

  return true;
}
