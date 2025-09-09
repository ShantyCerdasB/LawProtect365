/**
 * @file makeEnvelopesCommandsPort.ts
 * @summary Factory for EnvelopesCommandsPort
 * @description Creates and configures the EnvelopesCommandsPort implementation
 * with optional services (validation, audit, events)
 */

import type { EnvelopesCommandsPort, CreateEnvelopeCommand, CreateEnvelopeResult, UpdateEnvelopeCommand, UpdateEnvelopeResult, DeleteEnvelopeCommand, DeleteEnvelopeResult } from "../../ports/envelopes/EnvelopesCommandsPort";
import type { EnvelopesRepository } from "../../../domain/contracts/repositories/envelopes/EnvelopesRepository";
import type { EnvelopesValidationService } from "../../services/envelopes/EnvelopesValidationService";
import type { EnvelopesAuditService } from "../../services/envelopes/EnvelopesAuditService";
import type { EnvelopesEventService } from "../../services/envelopes/EnvelopesEventService";
import type { SignatureServiceConfig } from "../../../infrastructure/contracts/core/Config";
import type { EnvelopeStatus } from "@/domain/value-objects/index";
import type { PartyRepositoryDdb } from "../../../infrastructure/dynamodb/PartyRepositoryDdb";
import type { InputRepositoryDdb } from "../../../infrastructure/dynamodb/InputRepositoryDdb";
import { nowIso } from "@lawprotect/shared-ts";
import { 
  BadRequestError, 
  NotFoundError, 
  ConflictError,
  ErrorCodes 
} from "../../../shared/errors";
import { assertTenantBoundary } from "@lawprotect/shared-ts";
import { assertLifecycleTransition, assertDraft } from "../../../domain/rules/EnvelopeLifecycle.rules";
import { assertReadyToSend } from "../../../domain/rules/Flow.rules";

/**
 * Creates an EnvelopesCommandsPort implementation
 * @param envelopesRepo - The envelope repository for data persistence
 * @param ids - ID generation utilities
 * @param config - Service configuration
 * @param validationService - Optional validation service
 * @param auditService - Optional audit service
 * @param eventService - Optional event service
 * @returns Configured EnvelopesCommandsPort implementation
 */
export function makeEnvelopesCommandsPort(
  envelopesRepo: EnvelopesRepository,
  ids: { ulid(): string },
  _config: SignatureServiceConfig, // Used for future configuration extensions
  // ✅ REPOSITORIES FOR RULES VALIDATION
  partiesRepo: PartyRepositoryDdb,
  inputsRepo: InputRepositoryDdb,
  // ✅ SERVICIOS OPCIONALES - PATRÓN REUTILIZABLE
  validationService?: EnvelopesValidationService,
  auditService?: EnvelopesAuditService,
  eventService?: EnvelopesEventService,
  // ✅ RATE LIMITING - PATRÓN REUTILIZABLE
  rateLimitService?: any // EnvelopesRateLimitService
): EnvelopesCommandsPort {
    // Helper function to get system actor details
  const getSystemActor = () => ({
    userId: "system" as any,
    email: process.env.SYSTEM_EMAIL || "system@envelope.service"
  });

  return {
    /**
     * Creates a new envelope
     * @param command - Command data for creating an envelope
     * @returns Promise resolving to the created envelope
     */
    async create(command: CreateEnvelopeCommand): Promise<CreateEnvelopeResult> {
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
      // 1. VALIDATION (opcional)
      if (validationService) {
        const isValid = validationService.validateCreateParams({
          tenantId: command.tenantId,
          ownerId: command.ownerId,
          title: command.title,
        });
        if (!isValid) {
          throw new BadRequestError(
            "Invalid envelope creation parameters", 
            ErrorCodes.COMMON_BAD_REQUEST,
            { tenantId: command.tenantId, ownerId: command.ownerId, title: command.title }
          );
        }
      }

      // 2. BUSINESS LOGIC
      const envelopeId = ids.ulid() as any;
      const now = nowIso();
      
      const envelope = {
        envelopeId,
        tenantId: command.tenantId,
        ownerId: command.ownerId,
        title: command.title,
        status: "draft" as EnvelopeStatus,
        createdAt: now,
        updatedAt: now,
        parties: [],
        documents: [],
      };

      const result = await envelopesRepo.create(envelope);

      // 3. AUDIT (opcional) - MISMO PATRÓN
      if (auditService) {
        const auditContext = {
          tenantId: command.tenantId,
          actor: getSystemActor()
        };
        await auditService.logCreate(auditContext, {
          envelopeId: result.envelopeId,
          title: command.title,
          ownerId: command.ownerId,
        });
      }

      // 4. EVENTS (opcional) - MISMO PATRÓN
      if (eventService) {
        await eventService.publishEnvelopeCreatedEvent({
          tenantId: command.tenantId,
          actor: getSystemActor()
        }, {
          envelope: result
        });
      }

      // Ensure the result matches the expected CreateEnvelopeResult shape
      return { envelope: result };
    },

    /**
     * Updates an existing envelope
     * @param command - Command data for updating an envelope
     * @returns Promise resolving to the updated envelope
     */
    async update(command: UpdateEnvelopeCommand): Promise<UpdateEnvelopeResult> {
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
      // Get current envelope for domain rules
      const currentEnvelope = await envelopesRepo.getById(command.envelopeId);
      if (!currentEnvelope) {
        throw new NotFoundError(`Envelope ${command.envelopeId} not found`);
      }
      
      // Apply domain-specific rules
      if (command.status && currentEnvelope.status !== command.status) {
        assertLifecycleTransition(currentEnvelope.status, command.status);
        
        // If transitioning to "sent", validate envelope is ready
        if (command.status === "sent") {
          // Get actual parties and inputs for validation
          const parties = await partiesRepo.listByEnvelope({ 
            tenantId: command.tenantId, 
            envelopeId: command.envelopeId 
          });
          const inputs = await inputsRepo.listByEnvelope({ 
            envelopeId: command.envelopeId 
          });
          assertReadyToSend(parties.items, inputs.items);
          
          // Apply rate limiting for envelope sending
          if (rateLimitService) {
            await rateLimitService.checkSendEnvelopeLimit(command.tenantId);
          }
        }
      }
      
      if (command.parties || command.documents) {
        assertDraft({ status: currentEnvelope.status, envelopeId: command.envelopeId });
      }
      
      // 1. VALIDATION (opcional)
      if (validationService) {
        const isValid = validationService.validateUpdateParams({
          envelopeId: command.envelopeId,
          title: command.title,
          status: command.status,
        });
        if (!isValid) {
          throw new BadRequestError(
            "Invalid envelope update parameters", 
            ErrorCodes.COMMON_BAD_REQUEST,
            { envelopeId: command.envelopeId, title: command.title, status: command.status }
          );
        }
      }

      // 2. BUSINESS LOGIC
      const current = await envelopesRepo.getById(command.envelopeId);
      if (!current) {
        throw new NotFoundError(
          "Envelope not found", 
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: command.envelopeId }
        );
      }

      const previousStatus = current.status;
      const next = {
        ...current,
        title: command.title ?? current.title,
        status: command.status ?? current.status,
        updatedAt: nowIso(),
      };

      // Validate status transition if status is being changed
      if (command.status && validationService) {
        const canTransition = validationService.validateStatusTransition(previousStatus, command.status);
        if (!canTransition) {
          throw new ConflictError(
            `Invalid status transition from ${previousStatus} to ${command.status}`, 
            ErrorCodes.COMMON_CONFLICT,
            { previousStatus, newStatus: command.status, envelopeId: command.envelopeId }
          );
        }
      }

      const result = await envelopesRepo.update(command.envelopeId, next);

      // 3. AUDIT (opcional) - MISMO PATRÓN
      if (auditService) {
        const auditContext = {
          tenantId: command.tenantId,
          actor: getSystemActor()
        };
        await auditService.logUpdate(auditContext, {
          envelopeId: command.envelopeId,
          changes: { title: command.title, status: command.status },
          previousStatus,
        });
      }

      // 4. EVENTS (opcional) - MISMO PATRÓN
      if (eventService) {
        await eventService.publishEnvelopeUpdatedEvent({
          tenantId: command.tenantId,
          actor: getSystemActor()
        }, {
          envelope: result,
          previousStatus,
          changes: { title: command.title, status: command.status },
        });
      }

      // Ensure the returned result matches the expected UpdateEnvelopeResult type,
      // which requires an 'envelope' property.
      return { envelope: result };
    },

    /**
     * Deletes an envelope
     * @param command - Command data for deleting an envelope
     * @returns Promise resolving to deletion confirmation
     */
    async delete(command: DeleteEnvelopeCommand): Promise<DeleteEnvelopeResult> {
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
      // 1. VALIDATION (opcional)
      if (validationService) {
        const current = await envelopesRepo.getById(command.envelopeId);
        if (current && !validationService.canDeleteEnvelope(current.status)) {
          throw new ConflictError(
            "Envelope cannot be deleted in its current status", 
            ErrorCodes.COMMON_CONFLICT,
            { envelopeId: command.envelopeId, status: current.status }
          );
        }
      }

      // 2. BUSINESS LOGIC
      const current = await envelopesRepo.getById(command.envelopeId);
      if (!current) {
        throw new NotFoundError(
          "Envelope not found", 
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: command.envelopeId }
        );
      }

      await envelopesRepo.delete(command.envelopeId);

      // 3. AUDIT (opcional) - MISMO PATRÓN
      if (auditService) {
        const auditContext = {
          tenantId: command.tenantId,
          actor: getSystemActor()
        };
        await auditService.logDelete(auditContext, {
          envelopeId: command.envelopeId,
          title: current.title,
          status: current.status,
        });
      }

      // 4. EVENTS (opcional) - MISMO PATRÓN
      if (eventService) {
        await eventService.publishEnvelopeDeletedEvent({
          tenantId: command.tenantId,
          actor: getSystemActor()
        }, {
          envelopeId: command.envelopeId,
          title: current.title,
          status: current.status,
          tenantId: command.tenantId,
        });
      }

      return { deleted: true };
    },
  };
}






