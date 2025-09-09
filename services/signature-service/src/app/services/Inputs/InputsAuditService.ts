/**
 * @file InputsAuditService.ts
 * @summary Audit service for Input operations
 * @description Handles audit logging for input create, update, and delete operations
 */

import { BaseAuditService } from "../../../domain/services/BaseAuditService";
import type { AuditContext } from "@lawprotect/shared-ts";
import type { 
  CreateInputsCommand,
  UpdateInputCommand,
  UpdateInputPositionsCommand,
  DeleteInputCommand
} from "../../ports/inputs/InputsCommandsPort";

/**
 * @summary Audit service for Input operations
 * @description Extends BaseAuditService to provide input-specific audit logging
 */
export class InputsAuditService extends BaseAuditService {
  /**
   * @summary Logs a business event for audit purposes
   * @description Implements the abstract method from BaseAuditService
   */
  async logBusinessEvent(
    context: AuditContext, 
    details: Record<string, unknown>
  ): Promise<void> {
    await this.auditRepo.record({
      tenantId: context.tenantId,
      envelopeId: context.envelopeId || ("" as any),
      type: details.action as string,
      occurredAt: new Date().toISOString(),
      actor: context.actor || { email: "system" },
      metadata: details,
    });
  }

  /**
   * @summary Logs input creation audit event
   * @description Records audit information for input creation operations
   */
  async logCreate(auditContext: AuditContext, command: CreateInputsCommand): Promise<void> {
    const auditDetails = {
      action: "create_inputs",
      envelopeId: command.envelopeId,
      documentId: command.documentId,
      inputCount: command.inputs.length,
      inputTypes: command.inputs.map(input => input.type),
      actor: command.actor
    };

    await this.logBusinessEvent(auditContext, auditDetails);
  }

  /**
   * @summary Logs input update audit event
   * @description Records audit information for input update operations
   */
  async logUpdate(auditContext: AuditContext, command: UpdateInputCommand): Promise<void> {
    const auditDetails = {
      action: "update_input",
      envelopeId: command.envelopeId,
      inputId: command.inputId,
      updatedFields: Object.keys(command.updates),
      updates: command.updates,
      actor: command.actor
    };

    await this.logBusinessEvent(auditContext, auditDetails);
  }

  /**
   * @summary Logs input positions update audit event
   * @description Records audit information for input positions update operations
   */
  async logUpdatePositions(auditContext: AuditContext, command: UpdateInputPositionsCommand): Promise<void> {
    const auditDetails = {
      action: "update_input_positions",
      envelopeId: command.envelopeId,
      inputCount: command.items.length,
      inputIds: command.items.map(item => item.inputId),
      actor: command.actor
    };

    await this.logBusinessEvent(auditContext, auditDetails);
  }

  /**
   * @summary Logs input deletion audit event
   * @description Records audit information for input deletion operations
   */
  async logDelete(auditContext: AuditContext, command: DeleteInputCommand): Promise<void> {
    const auditDetails = {
      action: "delete_input",
      envelopeId: command.envelopeId,
      inputId: command.inputId,
      actor: command.actor
    };

    await this.logBusinessEvent(auditContext, auditDetails);
  }
};
