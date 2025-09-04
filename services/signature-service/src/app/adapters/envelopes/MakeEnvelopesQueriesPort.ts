/**
 * @file MakeEnvelopesQueriesPort.ts
 * @summary Adapter factory for Envelopes Queries Port
 * @description Creates EnvelopesQueriesPort implementation using DynamoDB repository.
 * Handles get by ID, list, and get status operations for Envelopes.
 */

import type { EnvelopesQueriesPort, GetEnvelopeQuery, GetEnvelopeResult, ListEnvelopesQuery, ListEnvelopesResult, GetEnvelopeStatusQuery, GetEnvelopeStatusResult } from "../../ports/envelopes/EnvelopesQueriesPort";
import type { EnvelopesRepository } from "../../../shared/contracts/repositories/envelopes/EnvelopesRepository";
import type { EnvelopesValidationService } from "../../services/envelopes/EnvelopesValidationService";
import type { EnvelopesAuditService } from "../../services/envelopes/EnvelopesAuditService";
import type { EnvelopesEventService } from "../../services/envelopes/EnvelopesEventService";
import type { AuditContext } from "../../../domain/entities/AuditContext";

/**
 * Creates an EnvelopesQueriesPort implementation with optional services
 * @param envelopesRepo - The envelope repository for data persistence
 * @param validationService - Optional validation service
 * @param auditService - Optional audit service
 * @param eventService - Optional event service
 * @returns Configured EnvelopesQueriesPort implementation
 */
export function makeEnvelopesQueriesPort(
  envelopesRepo: EnvelopesRepository,
  // ✅ SERVICIOS OPCIONALES - PATRÓN REUTILIZABLE
  validationService?: EnvelopesValidationService,
  auditService?: EnvelopesAuditService,
  eventService?: EnvelopesEventService
): EnvelopesQueriesPort {
  return {
    /**
     * Gets an envelope by ID
     * @param query - Query data for getting an envelope
     * @returns Promise resolving to the envelope or null
     */
    async getById(query: GetEnvelopeQuery): Promise<GetEnvelopeResult> {
      // 1. VALIDATION (opcional)
      if (validationService) {
        await validationService.validateGetById(query);
      }

      // 2. BUSINESS LOGIC
      const envelope = await envelopesRepo.getById(query.envelopeId);
      
      // Filter by tenant for security
      if (envelope && envelope.tenantId !== query.tenantId) {
        return { envelope: null };
      }

      // 3. AUDIT (opcional) - PATRÓN PRODUCTION-READY
      if (auditService && envelope) {
        const auditContext: AuditContext = {
          tenantId: query.tenantId,
          envelopeId: query.envelopeId,
          actor: query.actor
        };
        await auditService.logGetById(auditContext, { envelopeId: query.envelopeId });
      }

      // 4. EVENTS (opcional) - PATRÓN PRODUCTION-READY
      if (eventService && envelope) {
        const auditContext: AuditContext = {
          tenantId: query.tenantId,
          envelopeId: query.envelopeId,
          actor: query.actor
        };
        await eventService.publishEnvelopeAccessed(auditContext, { envelopeId: query.envelopeId });
      }

      return { envelope };
    },

    /**
     * Lists envelopes with optional filters
     * @param query - Query data for listing envelopes
     * @returns Promise resolving to paginated list of envelopes
     */
    async list(query: ListEnvelopesQuery): Promise<ListEnvelopesResult> {
      // 1. VALIDATION (opcional)
      if (validationService) {
        await validationService.validateList(query);
      }

      // 2. BUSINESS LOGIC
      const result = await envelopesRepo.listByTenant({
        tenantId: query.tenantId,
        limit: query.limit ?? 25,
        cursor: query.cursor,
      });

      // 3. AUDIT (opcional) - PATRÓN PRODUCTION-READY
      if (auditService) {
        const auditContext: AuditContext = {
          tenantId: query.tenantId,
          actor: query.actor
        };
        await auditService.logList(auditContext, { 
          limit: query.limit, 
          cursor: query.cursor,
          resultCount: result.items.length 
        });
      }

      // 4. EVENTS (opcional) - PATRÓN PRODUCTION-READY
      if (eventService) {
        const auditContext: AuditContext = {
          tenantId: query.tenantId,
          actor: query.actor
        };
        await eventService.publishEnvelopeListAccessed(auditContext, { 
          limit: query.limit, 
          cursor: query.cursor,
          resultCount: result.items.length 
        });
      }

      return result;
    },

    /**
     * Gets envelope status
     * @param query - Query data for getting envelope status
     * @returns Promise resolving to envelope status
     */
    async getStatus(query: GetEnvelopeStatusQuery): Promise<GetEnvelopeStatusResult> {
      // 1. VALIDATION (opcional)
      if (validationService) {
        await validationService.validateGetStatus(query);
      }

      // 2. BUSINESS LOGIC
      const envelope = await envelopesRepo.getById(query.envelopeId);
      if (!envelope) {
        return { status: "not_found" as any };
      }

      // Filter by tenant for security
      if (envelope.tenantId !== query.tenantId) {
        return { status: "not_found" as any };
      }

      // 3. AUDIT (opcional) - PATRÓN PRODUCTION-READY
      if (auditService) {
        const auditContext: AuditContext = {
          tenantId: query.tenantId,
          envelopeId: query.envelopeId,
          actor: query.actor
        };
        await auditService.logGetStatus(auditContext, { 
          envelopeId: query.envelopeId,
          status: envelope.status 
        });
      }

      // 4. EVENTS (opcional) - PATRÓN PRODUCTION-READY
      if (eventService) {
        const auditContext: AuditContext = {
          tenantId: query.tenantId,
          envelopeId: query.envelopeId,
          actor: query.actor
        };
        await eventService.publishEnvelopeStatusAccessed(auditContext, { 
          envelopeId: query.envelopeId,
          status: envelope.status 
        });
      }

      return { status: envelope.status };
    },
  };
}
