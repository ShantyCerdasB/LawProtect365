/**
 * @file makeInputsCommandsPort.ts
 * @summary Factory for InputsCommandsPort
 * @description Creates and configures the InputsCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for input command operations.
 */

import type { Repository } from "@lawprotect/shared-ts";
import type { Input } from "../../../domain/entities/Input";
import type { InputKey } from "../../../shared/types/infrastructure/dynamodb";
import type { InputId, PartyId } from "../../../domain/value-objects/Ids";
import type { Ids } from "../../../shared/types/parties";
import type { IdempotencyRunner } from "../../../infrastructure/idempotency/IdempotencyRunner";
import type { 
  InputsCommandsPort, 
  CreateInputsCommand, 
  CreateInputsResult, 
  UpdateInputCommand, 
  UpdateInputResult,
  UpdateInputPositionsCommand,
  UpdateInputPositionsResult,
  DeleteInputCommand
} from "../../ports/inputs/InputsCommandsPort";
import { InputsValidationService } from "../../services/Inputs/InputsValidationService";
import { InputsAuditService } from "../../services/Inputs/InputsAuditService";
import { InputsEventService } from "../../services/Inputs/InputsEventService";
import { nowIso, NotFoundError } from "@lawprotect/shared-ts";

/**
 * Creates an InputsCommandsPort implementation
 * @param inputsRepo - The input repository for data persistence
 * @param ids - ID generation service
 * @param validationService - Optional validation service
 * @param auditService - Optional audit service
 * @param eventService - Optional event service
 * @param idempotencyRunner - Optional idempotency runner
 * @returns Configured InputsCommandsPort implementation
 */
export const makeInputsCommandsPort = (
  inputsRepo: Repository<Input, InputKey>,
  ids: Ids,
  // ✅ SERVICIOS OPCIONALES - PATRÓN REUTILIZABLE
  validationService?: InputsValidationService,
  auditService?: InputsAuditService,
  eventService?: InputsEventService,
  // ✅ IDEMPOTENCY - PATRÓN REUTILIZABLE
  idempotencyRunner?: IdempotencyRunner
): InputsCommandsPort => {
  
  // 🔍 FUNCIÓN INTERNA PARA IDEMPOTENCY
  const createInternal = async (command: CreateInputsCommand): Promise<CreateInputsResult> => {
    // 1. VALIDATION (opcional)
    if (validationService) {
      await validationService.validateCreate(command);
    }

    // 2. BUSINESS LOGIC
    const now = nowIso();
    const createdInputs = [];

    for (const inputData of command.inputs) {
      const inputId = ids.ulid();
      
      const input: Input = {
        inputId: inputId as InputId,
        envelopeId: command.envelopeId,
        partyId: inputData.partyId || ("" as PartyId),
        documentId: command.documentId,
        type: inputData.type,
        required: inputData.required,
        position: {
          page: inputData.page,
          x: inputData.x,
          y: inputData.y,
        },
        value: inputData.value,
        createdAt: now,
        updatedAt: now,
      };

      const createdInput = await inputsRepo.create(input);
      createdInputs.push(createdInput);
    }

    const result: CreateInputsResult = {
      items: createdInputs.map(input => ({
        inputId: input.inputId as InputId,
        type: input.type,
        page: input.position.page,
        position: { x: input.position.x, y: input.position.y },
        assignedPartyId: input.partyId as PartyId | undefined,
        required: input.required,
      })),
      count: createdInputs.length,
    };

    // 3. AUDIT (opcional)
    if (auditService) {
      const auditContext = {
        tenantId: command.tenantId,
        envelopeId: command.envelopeId,
        actor: command.actor
      };
      await auditService.logCreate(auditContext, command);
    }

    // 4. EVENTS (opcional)
    if (eventService) {
      await eventService.publishInputsCreatedEvent(
        createdInputs.map(input => input.inputId),
        command.tenantId,
        command.envelopeId,
        command.documentId,
        command.actor
      );
    }

    return result;
  };

  // 🔍 FUNCIÓN INTERNA PARA IDEMPOTENCY
  const updateInternal = async (command: UpdateInputCommand): Promise<UpdateInputResult> => {
    // 1. VALIDATION (opcional)
    if (validationService) {
      await validationService.validateUpdate(command);
    }

    // 2. BUSINESS LOGIC
    const existing = await inputsRepo.getById({ 
      envelopeId: command.envelopeId, 
      inputId: command.inputId 
    });
    
    if (!existing) {
      throw new Error(`Input with ID ${command.inputId} not found in envelope ${command.envelopeId}`);
    }

    const now = nowIso();
    const updatedInput: Input = {
      ...existing,
      ...(command.updates.type !== undefined && { type: command.updates.type }),
      ...(command.updates.page !== undefined && { 
        position: { 
          ...existing.position, 
          page: command.updates.page 
        } 
      }),
      ...(command.updates.x !== undefined && { 
        position: { 
          ...existing.position, 
          x: command.updates.x 
        } 
      }),
      ...(command.updates.y !== undefined && { 
        position: { 
          ...existing.position, 
          y: command.updates.y 
        } 
      }),
      ...(command.updates.required !== undefined && { required: command.updates.required }),
      ...(command.updates.partyId !== undefined && { partyId: command.updates.partyId }),
      ...(command.updates.value !== undefined && { value: command.updates.value }),
      updatedAt: now,
    };

    const result = await inputsRepo.update(
      { envelopeId: command.envelopeId, inputId: command.inputId },
      updatedInput
    );

    // 3. AUDIT (opcional)
    if (auditService) {
      const auditContext = {
        tenantId: command.tenantId,
        envelopeId: command.envelopeId,
        actor: command.actor
      };
      await auditService.logUpdate(auditContext, command);
    }

    // 4. EVENTS (opcional)
    if (eventService) {
      const updatedFields = Object.keys(command.updates);
      await eventService.publishInputUpdatedEvent(
        command.inputId,
        command.tenantId,
        command.envelopeId,
        updatedFields,
        command.actor
      );
    }

    return {
      inputId: result.inputId as InputId,
      updatedAt: result.updatedAt,
    };
  };

  // 🔍 FUNCIÓN INTERNA PARA IDEMPOTENCY
  const updatePositionsInternal = async (command: UpdateInputPositionsCommand): Promise<UpdateInputPositionsResult> => {
    // 1. VALIDATION (opcional)
    if (validationService) {
      await validationService.validateUpdatePositions(command);
    }

    // 2. BUSINESS LOGIC
    let updatedCount = 0;
    const now = nowIso();

    for (const item of command.items) {
      const existing = await inputsRepo.getById({ 
        envelopeId: command.envelopeId, 
        inputId: item.inputId 
      });
      
      if (existing) {
        const updatedInput: Input = {
          ...existing,
          position: {
            page: item.page,
            x: item.x,
            y: item.y,
          },
          updatedAt: now,
        };

        await inputsRepo.update(
          { envelopeId: command.envelopeId, inputId: item.inputId },
          updatedInput
        );
        updatedCount++;
      }
    }

    // 3. AUDIT (opcional)
    if (auditService) {
      const auditContext = {
        tenantId: command.tenantId,
        envelopeId: command.envelopeId,
        actor: command.actor
      };
      await auditService.logUpdatePositions(auditContext, command);
    }

    // 4. EVENTS (opcional)
    if (eventService) {
      await eventService.publishInputPositionsUpdatedEvent(
        command.items.map(item => item.inputId),
        command.tenantId,
        command.envelopeId,
        command.actor
      );
    }

    return { updated: updatedCount };
  };

  // 🔍 FUNCIÓN INTERNA PARA IDEMPOTENCY
  const deleteInternal = async (command: DeleteInputCommand): Promise<void> => {
    // 1. VALIDATION (opcional)
    if (validationService) {
      await validationService.validateDelete(command);
    }

    // 2. BUSINESS LOGIC
    const existing = await inputsRepo.getById({ 
      envelopeId: command.envelopeId, 
      inputId: command.inputId 
    });
    
    if (!existing) {
      throw new Error(`Input with ID ${command.inputId} not found in envelope ${command.envelopeId}`);
    }

    await inputsRepo.delete({ 
      envelopeId: command.envelopeId, 
      inputId: command.inputId 
    });

    // 3. AUDIT (opcional)
    if (auditService) {
      const auditContext = {
        tenantId: command.tenantId,
        envelopeId: command.envelopeId,
        actor: command.actor
      };
      await auditService.logDelete(auditContext, command);
    }

    // 4. EVENTS (opcional)
    if (eventService) {
      await eventService.publishInputDeletedEvent(
        command.inputId,
        command.tenantId,
        command.envelopeId,
        command.actor
      );
    }
  };

  return {
    async create(command: CreateInputsCommand): Promise<CreateInputsResult> {
      // 🔍 IDEMPOTENCY WRAPPER - PATRÓN REUTILIZABLE
      if (idempotencyRunner) {
        const idempotencyKey = `create-inputs:${command.tenantId}:${command.envelopeId}:${command.documentId}`;
        return await idempotencyRunner.run(idempotencyKey, async () => {
          return await createInternal(command);
        });
      }
      
      // Fallback sin idempotency
      return await createInternal(command);
    },

    async update(command: UpdateInputCommand): Promise<UpdateInputResult> {
      // 🔍 IDEMPOTENCY WRAPPER - PATRÓN REUTILIZABLE
      if (idempotencyRunner) {
        const idempotencyKey = `update-input:${command.tenantId}:${command.envelopeId}:${command.inputId}`;
        return await idempotencyRunner.run(idempotencyKey, async () => {
          return await updateInternal(command);
        });
      }
      
      // Fallback sin idempotency
      return await updateInternal(command);
    },

    async updatePositions(command: UpdateInputPositionsCommand): Promise<UpdateInputPositionsResult> {
      // 🔍 IDEMPOTENCY WRAPPER - PATRÓN REUTILIZABLE
      if (idempotencyRunner) {
        const idempotencyKey = `update-input-positions:${command.tenantId}:${command.envelopeId}`;
        return await idempotencyRunner.run(idempotencyKey, async () => {
          return await updatePositionsInternal(command);
        });
      }
      
      // Fallback sin idempotency
      return await updatePositionsInternal(command);
    },

    async delete(command: DeleteInputCommand): Promise<void> {
      // 🔍 IDEMPOTENCY WRAPPER - PATRÓN REUTILIZABLE
      if (idempotencyRunner) {
        const idempotencyKey = `delete-input:${command.tenantId}:${command.envelopeId}:${command.inputId}`;
        return await idempotencyRunner.run(idempotencyKey, async () => {
          return await deleteInternal(command);
        });
      }
      
      // Fallback sin idempotency
      return await deleteInternal(command);
    },
  };
};
