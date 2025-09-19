/**
 * @file makeInputsQueriesPort.ts
 * @summary App adapter for InputsQueriesPort
 * @description Implements InputsQueriesPort with production-ready features including
 * audit context, security filtering, and optional services integration.
 */

import type { Input } from "../../../domain/entities/Input";
import type { InputId, PartyId } from "../../../domain/value-objects/ids";
import type { InputsQueriesPort } from "../../ports/inputs/InputsQueriesPort";
import type { InputsRepository } from "../../../domain/contracts/repositories/inputs/InputsRepository";
import type { InputsValidationService } from "../../services/Inputs/InputsValidationService";
import type { InputsAuditService } from "../../services/Inputs/InputsAuditService";
import type { AuditContext } from "@lawprotect/shared-ts";

/**
 * Creates an InputsQueriesPort implementation with production-ready features
 * @param inputsRepo - The input repository for data persistence
 * @param validationService - Optional validation service for query validation
 * @param auditService - Optional audit service for query logging
 * @returns InputsQueriesPort implementation
 */
export const makeInputsQueriesPort = (
  inputsRepo: InputsRepository,
  // ✅ SERVICIOS OPCIONALES - PATRÓN REUTILIZABLE
  validationService?: InputsValidationService,
  auditService?: InputsAuditService
): InputsQueriesPort => ({
  
  /**
   * @summary Gets a single input by ID with security filtering
   * @description Retrieves an input with tenant-based security filtering and audit logging
   */
  async getById(query) {
    // Apply generic rules
    // 1. VALIDATION (opcional)
    if (validationService) {
      await validationService.validateGetById(query);
    }

    // 2. SECURITY FILTERING - Solo inputs del tenant
    const input = await inputsRepo.getById({
      envelopeId: query.envelopeId,
      inputId: query.inputId});
    
    if (!input) {
      return null; // Retornar null en lugar de lanzar error para queries
    }

    // 3. AUDIT LOGGING (opcional)
    if (auditService && query.actor) {
      const auditContext: AuditContext = {
        envelopeId: query.envelopeId,
        actor: query.actor
      };
      
      await auditService.logBusinessEvent(auditContext, {
        action: "get_input_by_id",
        inputId: query.inputId,
        envelopeId: query.envelopeId,
        actor: query.actor
      });
    }
    
    return {
      inputId: input.inputId as InputId,
      type: input.type,
      page: input.position.page,
      position: {
        x: input.position.x,
        y: input.position.y},
      assignedPartyId: input.partyId,
      required: input.required,
      value: input.value,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt};
  },

  /**
   * @summary Lists inputs by envelope with security filtering and pagination
   * @description Retrieves inputs with tenant-based security filtering, audit logging, and pagination
   */
  async listByEnvelope(query) {
    // Apply generic rules
    // 1. VALIDATION (opcional)
    if (validationService) {
      await validationService.validateListByEnvelope(query);
    }

    // 2. SECURITY FILTERING - Solo inputs del tenant
    const result = await inputsRepo.listByEnvelope({
      envelopeId: query.envelopeId,
      limit: query.limit,
      cursor: query.cursor,
      documentId: query.documentId,
      partyId: query.partyId,
      type: query.type,
      required: query.required});

    // 3. AUDIT LOGGING (opcional)
    if (auditService && query.actor) {
      const auditContext: AuditContext = {
        envelopeId: query.envelopeId,
        actor: query.actor
      };
      
      await auditService.logBusinessEvent(auditContext, {
        action: "list_inputs_by_envelope",
        envelopeId: query.envelopeId,
        filters: {
          documentId: query.documentId,
          partyId: query.partyId,
          type: query.type,
          required: query.required},
        resultCount: result.items.length,
        actor: query.actor
      });
    }
    
    return {
      items: result.items.map((input: Input) => ({
        inputId: input.inputId as InputId,
        type: input.type,
        page: input.position.page,
        position: {
          x: input.position.x,
          y: input.position.y},
        assignedPartyId: input.partyId,
        required: input.required,
        value: input.value,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt})),
      nextCursor: result.nextCursor};
  }});
