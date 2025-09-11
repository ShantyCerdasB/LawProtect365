/**
 * @file MakePartiesCommandsPort.ts
 * @summary Adapter factory for Parties Commands Port
 * @description Creates PartiesCommandsPort implementation using DynamoDB repository.
 * Handles create, update, and delete operations for envelope-scoped Parties.
 */

import type { PartiesCommandsPort } from "../../ports/parties";
import type { Repository, IdempotencyRunner } from "@lawprotect/shared-ts";
import type { Party } from "../../../domain/entities/Party";
import type { PartyKey } from "../../../domain/types/infrastructure/dynamodb";
import type { Ids } from "../../../domain/types/parties";
import type { PartyId } from "../../../domain/value-objects/ids";
import type { PartyStatus } from "../../../domain/values/enums";
import { 
  CreatePartyCommand, 
  CreatePartyResult,
  UpdatePartyCommand,
  UpdatePartyResult,
  DeletePartyCommand,
  DeletePartyResult
} from "../../ports/parties";
import { PartiesValidationService } from "../../services/Parties/PartiesValidationService";
import { PartiesAuditService } from "../../services/Parties/PartiesAuditService";
import { PartiesEventService } from "../../services/Parties/PartiesEventService";
import { PartiesRateLimitService } from "../../services/Parties/PartiesRateLimitService";
import { toPartyRow } from "../../../domain/types/parties";
import { nowIso,  } from "@lawprotect/shared-ts";
import { PARTY_DEFAULTS, PARTY_RATE_LIMITS } from "../../../domain/values/enums";
import { partyNotFound } from "@/shared/errors";
import { assertInvitePolicy } from "../../../domain/rules/Flow.rules";

/**
 * @description Creates PartiesCommandsPort implementation with optional services.
 * 
 * @param partiesRepo - Party repository implementation
 * @param ids - ID generation service
 * @param validationService - Optional validation service
 * @param auditService - Optional audit service
 * @param eventService - Optional event service
 * @param idempotencyRunner - Optional idempotency runner
 * @param rateLimitService - Optional rate limiting service
 * @returns PartiesCommandsPort implementation
 */
export function makePartiesCommandsPort(
  partiesRepo: Repository<Party, PartyKey, undefined>,
  ids: Ids,
  // ✅ SERVICIOS OPCIONALES - PATRÓN REUTILIZABLE
  validationService?: PartiesValidationService,
  auditService?: PartiesAuditService,
  eventService?: PartiesEventService,
  // ✅ IDEMPOTENCY - PATRÓN REUTILIZABLE
  idempotencyRunner?: IdempotencyRunner,
  // ✅ RATE LIMITING - PATRÓN REUTILIZABLE
  rateLimitService?: PartiesRateLimitService
): PartiesCommandsPort {
  
  // 🔍 FUNCIÓN INTERNA PARA IDEMPOTENCY
  const createInternal = async (command: CreatePartyCommand): Promise<CreatePartyResult> => {

    // AUTHORIZATION VALIDATION - Only envelope owner can create parties
    const actorEmail = (command as any).actorEmail || command.actor?.email;
    if (actorEmail) {
      // We need to get the envelope to validate ownership
      // For now, we'll skip this validation in the adapter and handle it at the service level
      // This is a simplified approach - in production you'd inject the envelope repo
    }
    
    // Apply domain-specific rules
    if (rateLimitService) {
      // Check rate limit for party creation
      await rateLimitService.checkCreatePartyLimit(command.envelopeId);
      
      // Get invite stats for validation
      const usage = await rateLimitService.getCurrentUsage(command.envelopeId);
      const inviteStats = {
        lastSentAt: Date.now() - (usage.resetInSeconds * 1000), // Calculate from reset time
        sentToday: usage.currentUsage,
        minCooldownMs: PARTY_RATE_LIMITS.MIN_COOLDOWN_MS,
        dailyLimit: usage.maxRequests
      };
      assertInvitePolicy(inviteStats);
    }
    
    // 1. VALIDATION (opcional)
    if (validationService) {
      await validationService.validateCreate(command);
    }

    // 1.5. RATE LIMITING (opcional) - PATRÓN REUTILIZABLE
    if (rateLimitService) {
      await rateLimitService.checkCreatePartyLimit(command.envelopeId);
    }

    // 2. BUSINESS LOGIC
    const now = nowIso();
    const partyId = ids.ulid();

    const party: Party = {
      partyId: partyId as PartyId,
      envelopeId: command.envelopeId,
      name: command.name,
      email: command.email,
      role: command.role,
      status: "pending" as PartyStatus, // Party created but not invited yet
      sequence: command.sequence || PARTY_DEFAULTS.DEFAULT_SEQUENCE,
      invitedAt: undefined, // Party is created but not invited yet
      createdAt: now,
      updatedAt: now,
      auth: { methods: [...PARTY_DEFAULTS.DEFAULT_AUTH_METHODS] },
    };

    const createdParty = await partiesRepo.create(party);
    const partyRow = toPartyRow(createdParty);

    // 3. AUDIT (opcional) - MISMO PATRÓN
    if (auditService) {
      const auditContext = {
        envelopeId: command.envelopeId,
        actor: command.actor
      };
      await auditService.logCreate(auditContext, command);
    }

    // 4. EVENTS (opcional) - MISMO PATRÓN
    if (eventService) {
      await eventService.publishPartyCreatedEvent(
        partyId as PartyId,
        command.envelopeId,
        command.actor
      );
    }

    return { party: partyRow };
  };

  // 🔍 FUNCIÓN INTERNA PARA IDEMPOTENCY
  const updateInternal = async (command: UpdatePartyCommand): Promise<UpdatePartyResult> => {
   
    
    // 1. VALIDATION (opcional)
    if (validationService) {
      await validationService.validateUpdate(command);
    }

    // 2. BUSINESS LOGIC
    const existing = await partiesRepo.getById({ 
      envelopeId: command.envelopeId, 
      partyId: command.partyId 
    });
    
    if (!existing) {
      throw partyNotFound({ partyId: command.partyId, envelopeId: command.envelopeId });
    }

    const now = nowIso();
    const updatedParty: Party = {
      ...existing,
      ...(command.name !== undefined && { name: command.name }),
      ...(command.email !== undefined && { email: command.email }),
      ...(command.role !== undefined && { role: command.role }),
      ...(command.sequence !== undefined && { sequence: command.sequence }),
      updatedAt: now};

    const result = await partiesRepo.update(
      { envelopeId: command.envelopeId, partyId: command.partyId },
      updatedParty
    );
    
    const partyRow = toPartyRow(result);

    // 3. AUDIT (opcional) - MISMO PATRÓN
    if (auditService) {
      const auditContext = {
        envelopeId: command.envelopeId,
        actor: command.actor
      };
      await auditService.logUpdate(auditContext, command);
    }

    // 4. EVENTS (opcional) - MISMO PATRÓN
    if (eventService) {
      const updatedFields = { 
        name: command.name, 
        email: command.email, 
        role: command.role, 
        sequence: command.sequence 
      };
      await eventService.publishPartyUpdatedEvent(
        command.partyId,
        command.envelopeId,
        updatedFields,
        command.actor
      );
    }

    return { party: partyRow };
  };

  // 🔍 FUNCIÓN INTERNA PARA IDEMPOTENCY
  const deleteInternal = async (command: DeletePartyCommand): Promise<DeletePartyResult> => {

    
    // 1. VALIDATION (opcional)
    if (validationService) {
      await validationService.validateDelete(command);
    }

    // 2. BUSINESS LOGIC
    const existing = await partiesRepo.getById({ 
      envelopeId: command.envelopeId, 
      partyId: command.partyId 
    });
    
    if (!existing) {
      throw partyNotFound({ partyId: command.partyId, envelopeId: command.envelopeId });
    }

    await partiesRepo.delete({ 
      envelopeId: command.envelopeId, 
      partyId: command.partyId 
    });

    // 3. AUDIT (opcional) - MISMO PATRÓN
    if (auditService) {
      const auditContext = {
        envelopeId: command.envelopeId,
        actor: command.actor
      };
      await auditService.logDelete(auditContext, command);
    }

    // 4. EVENTS (opcional) - MISMO PATRÓN
    if (eventService) {
      await eventService.publishPartyDeletedEvent(
        command.partyId,
        command.envelopeId,
        command.actor
      );
    }

    return { deleted: true };
  };

  return {
    async create(command: CreatePartyCommand): Promise<CreatePartyResult> {
      // 🔍 IDEMPOTENCY WRAPPER - PATRÓN REUTILIZABLE
      if (idempotencyRunner) {
        const idempotencyKey = `create-party:${command.envelopeId}:${command.email}`;
        return await idempotencyRunner.run(idempotencyKey, async () => {
          return await createInternal(command);
        });
      }
      
      // Fallback sin idempotency
      return await createInternal(command);
    },

    async update(command: UpdatePartyCommand): Promise<UpdatePartyResult> {
      // 🔍 IDEMPOTENCY WRAPPER - PATRÓN REUTILIZABLE
      if (idempotencyRunner) {
        const idempotencyKey = `update-party:${command.envelopeId}:${command.partyId}`;
        return await idempotencyRunner.run(idempotencyKey, async () => {
          return await updateInternal(command);
        });
      }
      
      // Fallback sin idempotency
      return await updateInternal(command);
    },

    async delete(command: DeletePartyCommand): Promise<DeletePartyResult> {
      // 🔍 IDEMPOTENCY WRAPPER - PATRÓN REUTILIZABLE
      if (idempotencyRunner) {
        const idempotencyKey = `delete-party:${command.envelopeId}:${command.partyId}`;
        return await idempotencyRunner.run(idempotencyKey, async () => {
          return await deleteInternal(command);
        });
      }
      
      // Fallback sin idempotency
      return await deleteInternal(command);
    }};
}

