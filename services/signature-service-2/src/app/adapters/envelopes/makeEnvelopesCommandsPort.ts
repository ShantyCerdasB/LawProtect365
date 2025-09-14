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
import type { SignatureServiceConfig } from "../../../core/Config";
import type { EnvelopeStatus } from "@/domain/value-objects/index";
import type { PartyRepositoryDdb } from "../../../infrastructure/dynamodb/PartyRepositoryDdb";
// import type { InputRepositoryDdb } from "../../../infrastructure/dynamodb/InputRepositoryDdb"; // Moved to Documents Service
import { nowIso } from "@lawprotect/shared-ts";
import { ENVELOPE_STATUSES } from "@/domain/values/enums";
import type { EnvelopeId, UserId } from "@/domain/value-objects/ids";
import { 
  BadRequestError, 
  ForbiddenError,
  NotFoundError, 
  ConflictError,
  ErrorCodes 
} from "../../../shared/errors";
import { assertLifecycleTransition, assertDraft } from "../../../domain/rules/EnvelopeLifecycle.rules";
import { assertReadyToSend } from "../../../domain/rules/Flow.rules";

/**
 * Configuration for EnvelopesCommandsPort
 */
interface EnvelopesCommandsPortConfig {
  envelopesRepo: EnvelopesRepository;
  ids: { ulid(): string };
  config: SignatureServiceConfig;
  partiesRepo: PartyRepositoryDdb;
  // inputsRepo: InputRepositoryDdb; // Moved to Documents Service
  validationService?: EnvelopesValidationService;
  auditService?: EnvelopesAuditService;
  eventService?: EnvelopesEventService;
  rateLimitService?: any; // EnvelopesRateLimitService
}

/**
 * Creates an EnvelopesCommandsPort implementation
 * @param config - Configuration object containing all dependencies
 * @returns Configured EnvelopesCommandsPort implementation
 */
export function makeEnvelopesCommandsPort(
  config: EnvelopesCommandsPortConfig
): EnvelopesCommandsPort {
  const {
    envelopesRepo,
    ids,
    config: _config,
    partiesRepo,
    // inputsRepo, // Moved to Documents Service
    validationService,
    auditService,
    eventService,
    rateLimitService
  } = config;
    // Helper function to get system actor details
  const getSystemActor = () => ({
    userId: _config.system.userId as UserId,
    email: _config.system.email
  });

  // Helper methods for update function to reduce cognitive complexity
  const validateStatusTransition = async (command: UpdateEnvelopeCommand, currentEnvelope: any) => {
    if (command.status && currentEnvelope.status !== command.status) {
      assertLifecycleTransition(currentEnvelope.status, command.status);
      
      // If transitioning to "sent", validate envelope is ready
      if (command.status === "sent") {
        // Get actual parties for validation
        const parties = await partiesRepo.listByEnvelope({
          envelopeId: command.envelopeId
        });
        // Use hasInputs from command (provided by frontend from Documents Service)
        const hasInputs = command.hasInputs ?? false;
        assertReadyToSend(parties.items, hasInputs);
        
        // Apply rate limiting for envelope sending
        if (rateLimitService) {
          // Rate limiting removed for now
        }
      }
    }
  };

  const validateDraftModifications = (command: UpdateEnvelopeCommand, currentEnvelope: any) => {
    if (command.parties || command.documents) {
      assertDraft({ status: currentEnvelope.status, envelopeId: command.envelopeId });
    }
  };

  const validateUpdateParams = (command: UpdateEnvelopeCommand) => {
    if (validationService) {
      const isValid = validationService.validateUpdateParams({
        envelopeId: command.envelopeId,
        name: command.name,
        status: command.status});
      if (!isValid) {
        throw new BadRequestError(
          "Invalid envelope update parameters", 
          ErrorCodes.COMMON_BAD_REQUEST,
          { envelopeId: command.envelopeId, name: command.name, status: command.status }
        );
      }
    }
  };

  const performUpdate = async (command: UpdateEnvelopeCommand) => {
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
      name: command.name ?? current.name,
      status: command.status ?? current.status,
      updatedAt: nowIso()};

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

    return await envelopesRepo.update(command.envelopeId, next);
  };

  const logAudit = async (command: UpdateEnvelopeCommand, _result: any, previousStatus: string) => {
    if (auditService) {
      const auditContext = {
        actor: getSystemActor()
      };
      await auditService.logUpdate(auditContext, {
        envelopeId: command.envelopeId,
        changes: { name: command.name, status: command.status },
        previousStatus: previousStatus as EnvelopeStatus});
    }
  };

  const publishEvents = async (command: UpdateEnvelopeCommand, result: any, previousStatus: string) => {
    if (eventService) {
      await eventService.publishEnvelopeUpdatedEvent({
        actor: getSystemActor()
      }, {
        envelope: result,
        previousStatus: previousStatus as EnvelopeStatus,
        changes: { name: command.name, status: command.status }});
    }
  };

  return {
    /**
     * Creates a new envelope
     * @param command - Command data for creating an envelope
     * @returns Promise resolving to the created envelope
     */
    async create(command: CreateEnvelopeCommand): Promise<CreateEnvelopeResult> {
      // Apply generic rules
      // Tenant boundary validation removed - using email-based access control
      
      // 1. VALIDATION (opcional)
      if (validationService) {
        // Get actor email from context (this would come from the framework)
        const actorEmail = (command as any).actorEmail; // Temporary - should come from framework context
        const isValid = validationService.validateCreateParams({
          ownerEmail: command.ownerEmail,
          name: command.name}, actorEmail);
        if (!isValid) {
          // Check if it's an authorization issue
          if (actorEmail && command.ownerEmail !== actorEmail) {
            throw new ForbiddenError(
              "Unauthorized: You can only create envelopes for your own email", 
              ErrorCodes.AUTH_FORBIDDEN,
              { ownerEmail: command.ownerEmail, name: command.name, actorEmail }
            );
          } else {
            throw new BadRequestError(
              "Invalid envelope creation parameters", 
              ErrorCodes.COMMON_BAD_REQUEST,
              { ownerEmail: command.ownerEmail, name: command.name, actorEmail }
            );
          }
        }
      }

      // 1.5. AUTHORIZATION VALIDATION - Enforce ownership
      const actorEmail = (command as any).actorEmail;
      if (actorEmail && command.ownerEmail !== actorEmail) {
        throw new ForbiddenError(
          "Unauthorized: You can only create envelopes for your own email", 
          ErrorCodes.AUTH_FORBIDDEN,
          { ownerEmail: command.ownerEmail, actorEmail }
        );
      }

      // 2. BUSINESS LOGIC
      const envelopeId = ids.ulid() as EnvelopeId;
      const now = nowIso();
      
      const envelope = {
        envelopeId,
        ownerEmail: command.ownerEmail,
        name: command.name,
        status: ENVELOPE_STATUSES[0] as EnvelopeStatus, // "draft"
        createdAt: now,
        updatedAt: now,
        parties: [],
        documents: []};

      const result = await envelopesRepo.create(envelope);

      // 3. AUDIT (opcional) - MISMO PATRÓN
      if (auditService) {
        const auditContext = {
          actor: getSystemActor()
        };
        await auditService.logCreate(auditContext, {
          envelopeId: result.envelopeId,
          name: command.name,
          ownerEmail: command.ownerEmail});
      }

      // 4. EVENTS (opcional) - MISMO PATRÓN
      if (eventService) {
        await eventService.publishEnvelopeCreatedEvent({
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
      // Tenant boundary validation removed - using email-based access control
      
      // Get current envelope for domain rules
      const currentEnvelope = await envelopesRepo.getById(command.envelopeId);
      if (!currentEnvelope) {
        throw new NotFoundError(`Envelope ${command.envelopeId} not found`);
      }
      
      // Apply domain-specific rules
      await validateStatusTransition(command, currentEnvelope);
      validateDraftModifications(command, currentEnvelope);
      
      // 1. VALIDATION (opcional)
      validateUpdateParams(command);
      
      // 2. BUSINESS LOGIC
      const result = await performUpdate(command);

      // 3. AUDIT (opcional) - MISMO PATRÓN
      await logAudit(command, result, currentEnvelope.status);

      // 4. EVENTS (opcional) - MISMO PATRÓN
      await publishEvents(command, result, currentEnvelope.status);

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
      // Tenant boundary validation removed - using email-based access control
      
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
          actor: getSystemActor()
        };
        await auditService.logDelete(auditContext, {
          envelopeId: command.envelopeId,
          name: current.name,
          status: current.status});
      }

      // 4. EVENTS (opcional) - MISMO PATRÓN
      if (eventService) {
        await eventService.publishEnvelopeDeletedEvent({
          actor: getSystemActor()
        }, {
          envelopeId: command.envelopeId,
          name: current.name,
          status: current.status});
      }

      return { deleted: true };
    }};
}
