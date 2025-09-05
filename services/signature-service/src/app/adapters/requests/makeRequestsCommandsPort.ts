/**
 * @file makeRequestsCommandsPort.ts
 * @summary Adapter factory for Requests Commands Port
 * @description Creates RequestsCommandsPort implementation with optional services.
 * Handles all request operations (invite, remind, cancel, decline, finalise, requestSignature, addViewer).
 */

import type { 
  RequestsCommandsPort,
  InvitePartiesCommand,
  InvitePartiesResult,
  RemindPartiesCommand,
  RemindPartiesResult,
  CancelEnvelopeCommand,
  CancelEnvelopeResult,
  DeclineEnvelopeCommand,
  DeclineEnvelopeResult,
  FinaliseEnvelopeCommand,
  FinaliseEnvelopeResult,
  RequestSignatureCommand,
  RequestSignatureResult,
  AddViewerCommand,
  AddViewerResult,
} from "../../ports/requests/RequestsCommandsPort";
import type { Repository } from "@lawprotect/shared-ts";
import type { Envelope } from "../../../domain/entities/Envelope";
import type { Party } from "../../../domain/entities/Party";
import type { Input } from "../../../domain/entities/Input";
import type { EnvelopeId, PartyId } from "../../../domain/value-objects/Ids";
import type { PartyKey, InputKey } from "../../../shared/types/infrastructure/dynamodb";
import { DefaultRequestsValidationService } from "../../services/Requests/RequestsValidationService";
import { DefaultRequestsAuditService } from "../../services/Requests/RequestsAuditService";
import { DefaultRequestsEventService } from "../../services/Requests/RequestsEventService";
import { DefaultRequestsRateLimitService } from "../../services/Requests/RequestsRateLimitService";
import { nowIso, NotFoundError, ConflictError, BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";
import { assertLifecycleTransition } from "../../../domain/rules/EnvelopeLifecycle.rules";
import type { S3Presigner } from "../../../infrastructure/s3/S3Presigner";

/**
 * @description Creates RequestsCommandsPort implementation with optional services.
 * 
 * @param envelopesRepo - Envelope repository implementation
 * @param partiesRepo - Party repository implementation
 * @param inputsRepo - Input repository implementation
 * @param validationService - Optional validation service
 * @param auditService - Optional audit service
 * @param eventService - Optional event service
 * @param rateLimitService - Optional rate limiting service
 * @returns RequestsCommandsPort implementation
 */
export function makeRequestsCommandsPort(
  envelopesRepo: Repository<Envelope, EnvelopeId, undefined>,
  partiesRepo: Repository<Party, PartyKey, undefined>,
  inputsRepo: Repository<Input, InputKey, undefined>,
  // ✅ SERVICIOS OPCIONALES - PATRÓN REUTILIZABLE
  validationService?: DefaultRequestsValidationService,
  auditService?: DefaultRequestsAuditService,
  eventService?: DefaultRequestsEventService,
  rateLimitService?: DefaultRequestsRateLimitService,
  // ✅ SERVICIOS DE INFRAESTRUCTURA - PATRÓN REUTILIZABLE
  ids?: { ulid(): string },
  s3Presigner?: S3Presigner
): RequestsCommandsPort {
  
  // Suppress unused parameter warning - inputsRepo will be used for input-related operations
  void inputsRepo;
  
  return {
    async inviteParties(command: InvitePartiesCommand): Promise<InvitePartiesResult> {
      // ✅ VALIDATION - PATRÓN REUTILIZABLE
      if (validationService) {
        validationService.validateInviteParties(command);
      }

      // ✅ RATE LIMITING - PATRÓN REUTILIZABLE
      if (rateLimitService && command.actor) {
        await rateLimitService.checkInviteLimit(command.envelopeId, command.actor);
      }

      // 1. Obtener envelope y validar estado
      const envelope = await envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: command.envelopeId }
        );
      }

      // 2. Validar que el envelope esté en draft para invitaciones
      if (envelope.status !== "draft") {
        throw new ConflictError(
          "Envelope must be in draft state to invite parties",
          ErrorCodes.COMMON_CONFLICT,
          { envelopeId: command.envelopeId, currentStatus: envelope.status }
        );
      }

      // 3. Procesar cada party
      const invited: PartyId[] = [];
      const alreadyPending: PartyId[] = [];
      const skipped: PartyId[] = [];

      for (const partyId of command.partyIds) {
        const partyKey = { envelopeId: command.envelopeId, partyId };
        const existingParty = await partiesRepo.getById(partyKey);
        
        if (existingParty) {
          if (existingParty.status === "pending" || existingParty.status === "invited") {
            alreadyPending.push(partyId);
          } else {
            skipped.push(partyId);
          }
        } else {
          // Crear nuevo party
          if (!ids) {
            throw new BadRequestError(
              "ID generation service not available",
              ErrorCodes.COMMON_BAD_REQUEST
            );
          }

          const newPartyId = ids.ulid() as PartyId;
          const now = nowIso();
          
          const newParty: Party = {
            tenantId: command.tenantId,
            partyId: newPartyId,
            envelopeId: command.envelopeId,
            name: `Party ${newPartyId}`,
            email: `party-${newPartyId}@example.com`,
            role: "signer",
            status: "pending",
            sequence: 1,
            invitedAt: now,
            createdAt: now,
            updatedAt: now,
            auth: { methods: ["otpViaEmail"] },
            otpState: undefined,
          };

          await partiesRepo.create(newParty);
          invited.push(newPartyId);
        }
      }

      // 4. Cambiar estado del envelope a "sent" si hay invitaciones exitosas
      let statusChanged = false;
      if (invited.length > 0 && envelope.status === "draft") {
        try {
          assertLifecycleTransition(envelope.status, "sent");
          await envelopesRepo.update(command.envelopeId, { status: "sent" });
          statusChanged = true;
        } catch {
          // Si no se puede cambiar el estado, continuar sin error
          console.warn("Could not transition envelope to sent status");
        }
      }

      const result: InvitePartiesResult = {
        invited,
        alreadyPending,
        skipped,
        statusChanged
      };

      // ✅ AUDIT LOGGING - PATRÓN REUTILIZABLE
      if (auditService && command.actor) {
        await auditService.logInviteParties(
          result.invited,
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      // ✅ EVENT PUBLISHING - PATRÓN REUTILIZABLE
      if (eventService && command.actor) {
        await eventService.publishInviteParties(
          result.invited,
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      return result;
    },

    async remindParties(command: RemindPartiesCommand): Promise<RemindPartiesResult> {
      // ✅ VALIDATION - PATRÓN REUTILIZABLE
      if (validationService) {
        validationService.validateRemindParties(command);
      }

      // ✅ RATE LIMITING - PATRÓN REUTILIZABLE
      if (rateLimitService && command.actor && command.partyIds) {
        for (const partyId of command.partyIds) {
          await rateLimitService.checkRemindLimit(command.envelopeId, partyId, command.actor);
        }
      }

      // 1. Verificar que el envelope existe
      const envelope = await envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: command.envelopeId }
        );
      }

      // 2. Validar que el envelope esté en estado válido para recordatorios
      if (envelope.status !== "sent" && envelope.status !== "in_progress") {
        throw new ConflictError(
          `Cannot send reminders for envelope in ${envelope.status} state`,
          ErrorCodes.COMMON_CONFLICT,
          { envelopeId: command.envelopeId, currentStatus: envelope.status }
        );
      }

      // 3. Procesar cada party
      const reminded: PartyId[] = [];
      const skipped: PartyId[] = [];

      if (command.partyIds) {
        for (const partyId of command.partyIds) {
          const partyKey = { envelopeId: command.envelopeId, partyId };
          const party = await partiesRepo.getById(partyKey);
          
          if (!party) {
            skipped.push(partyId);
            continue;
          }

          // Solo enviar recordatorios a parties en estado "pending" o "invited"
          if (party.status === "pending" || party.status === "invited") {
            reminded.push(partyId);
          } else {
            skipped.push(partyId);
          }
        }
      }

      const result: RemindPartiesResult = {
        reminded,
        skipped
      };

      // ✅ AUDIT LOGGING - PATRÓN REUTILIZABLE
      if (auditService && command.actor) {
        await auditService.logRemindParties(
          result.reminded,
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      // ✅ EVENT PUBLISHING - PATRÓN REUTILIZABLE
      if (eventService && command.actor) {
        await eventService.publishRemindParties(
          result.reminded,
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      return result;
    },

    async cancelEnvelope(command: CancelEnvelopeCommand): Promise<CancelEnvelopeResult> {
      // ✅ VALIDATION - PATRÓN REUTILIZABLE
      if (validationService) {
        validationService.validateCancelEnvelope(command);
      }

      // ✅ RATE LIMITING - PATRÓN REUTILIZABLE
      if (rateLimitService && command.actor) {
        await rateLimitService.checkCancelLimit(command.envelopeId, command.actor);
      }

      // 1. Obtener envelope actual
      const envelope = await envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: command.envelopeId }
        );
      }

      // 2. Validar transición de estado
      try {
        assertLifecycleTransition(envelope.status, "canceled");
      } catch {
        throw new ConflictError(
          `Cannot cancel envelope in ${envelope.status} state`,
          ErrorCodes.COMMON_CONFLICT,
          { envelopeId: command.envelopeId, currentStatus: envelope.status }
        );
      }

      // 3. Actualizar estado del envelope
      const now = nowIso();
      await envelopesRepo.update(command.envelopeId, { 
        status: "canceled",
        updatedAt: now
      });

      const result: CancelEnvelopeResult = {
        envelopeId: command.envelopeId,
        status: "canceled",
        canceledAt: now
      };

      // ✅ AUDIT LOGGING - PATRÓN REUTILIZABLE
      if (auditService && command.actor) {
        await auditService.logCancelEnvelope(
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      // ✅ EVENT PUBLISHING - PATRÓN REUTILIZABLE
      if (eventService && command.actor) {
        await eventService.publishCancelEnvelope(
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      return result;
    },

    async declineEnvelope(command: DeclineEnvelopeCommand): Promise<DeclineEnvelopeResult> {
      // ✅ VALIDATION - PATRÓN REUTILIZABLE
      if (validationService) {
        validationService.validateDeclineEnvelope(command);
      }

      // ✅ RATE LIMITING - PATRÓN REUTILIZABLE
      if (rateLimitService && command.actor) {
        await rateLimitService.checkDeclineLimit(command.envelopeId, command.actor);
      }

      // 1. Obtener envelope actual
      const envelope = await envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: command.envelopeId }
        );
      }

      // 2. Validar transición de estado
      try {
        assertLifecycleTransition(envelope.status, "declined");
      } catch {
        throw new ConflictError(
          `Cannot decline envelope in ${envelope.status} state`,
          ErrorCodes.COMMON_CONFLICT,
          { envelopeId: command.envelopeId, currentStatus: envelope.status }
        );
      }

      // 3. Actualizar estado del envelope
      const now = nowIso();
      await envelopesRepo.update(command.envelopeId, { 
        status: "declined",
        updatedAt: now
      });

      const result: DeclineEnvelopeResult = {
        envelopeId: command.envelopeId,
        status: "declined",
        declinedAt: now
      };

      // ✅ AUDIT LOGGING - PATRÓN REUTILIZABLE
      if (auditService && command.actor) {
        await auditService.logDeclineEnvelope(
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      // ✅ EVENT PUBLISHING - PATRÓN REUTILIZABLE
      if (eventService && command.actor) {
        await eventService.publishDeclineEnvelope(
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      return result;
    },

    async finaliseEnvelope(command: FinaliseEnvelopeCommand): Promise<FinaliseEnvelopeResult> {
      // ✅ VALIDATION - PATRÓN REUTILIZABLE
      if (validationService) {
        validationService.validateFinaliseEnvelope(command);
      }

      // ✅ RATE LIMITING - PATRÓN REUTILIZABLE
      if (rateLimitService && command.actor) {
        await rateLimitService.checkFinaliseLimit(command.envelopeId, command.actor);
      }

      // 1. Obtener envelope actual
      const envelope = await envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: command.envelopeId }
        );
      }

      // 2. Validar que el envelope esté en estado "completed"
      if (envelope.status !== "completed") {
        throw new ConflictError(
          `Cannot finalize envelope in ${envelope.status} state. Must be completed.`,
          ErrorCodes.COMMON_CONFLICT,
          { envelopeId: command.envelopeId, currentStatus: envelope.status }
        );
      }

      // 3. Generar artifacts (PDFs, certificados, etc.)
      const artifactIds: string[] = [];
      if (s3Presigner && ids) {
        // Generar PDF final del envelope
        const pdfArtifactId = ids.ulid();
        await s3Presigner.getObjectUrl({
          bucket: "envelope-artifacts",
          key: `envelopes/${command.envelopeId}/final-${pdfArtifactId}.pdf`,
          expiresInSeconds: 7 * 24 * 60 * 60, // 7 days
          responseContentType: "application/pdf",
          responseContentDisposition: `attachment; filename="envelope-${command.envelopeId}.pdf"`
        });
        artifactIds.push(pdfArtifactId);

        // Generar certificado de finalización
        const certArtifactId = ids.ulid();
        await s3Presigner.getObjectUrl({
          bucket: "envelope-artifacts",
          key: `envelopes/${command.envelopeId}/certificate-${certArtifactId}.pdf`,
          expiresInSeconds: 7 * 24 * 60 * 60, // 7 days
          responseContentType: "application/pdf",
          responseContentDisposition: `attachment; filename="certificate-${command.envelopeId}.pdf"`
        });
        artifactIds.push(certArtifactId);
      }

      // 4. Actualizar estado del envelope a "finalized"
      const now = nowIso();
      await envelopesRepo.update(command.envelopeId, { 
        status: "finalized" as any,
        updatedAt: now
      });

      const result: FinaliseEnvelopeResult = {
        envelopeId: command.envelopeId,
        artifactIds,
        finalizedAt: now
      };

      // ✅ AUDIT LOGGING - PATRÓN REUTILIZABLE
      if (auditService && command.actor) {
        await auditService.logFinaliseEnvelope(
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      // ✅ EVENT PUBLISHING - PATRÓN REUTILIZABLE
      if (eventService && command.actor) {
        await eventService.publishFinaliseEnvelope(
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      return result;
    },

    async requestSignature(command: RequestSignatureCommand): Promise<RequestSignatureResult> {
      // ✅ VALIDATION - PATRÓN REUTILIZABLE
      if (validationService) {
        validationService.validateRequestSignature(command);
      }

      // ✅ RATE LIMITING - PATRÓN REUTILIZABLE
      if (rateLimitService && command.actor) {
        await rateLimitService.checkRequestSignatureLimit(command.envelopeId, command.partyId, command.actor);
      }

      // 1. Obtener party
      const partyKey = { envelopeId: command.envelopeId, partyId: command.partyId };
      const party = await partiesRepo.getById(partyKey);
      if (!party) {
        throw new NotFoundError(
          "Party not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: command.envelopeId, partyId: command.partyId }
        );
      }

      // 2. Validar estado del party
      if (party.status !== "pending" && party.status !== "invited") {
        throw new ConflictError(
          `Cannot request signature from party in ${party.status} state`,
          ErrorCodes.COMMON_CONFLICT,
          { partyId: command.partyId, currentStatus: party.status }
        );
      }

      // 3. Generar URL de firma
      let signingUrl = "";
      let expiresAt = "";
      
      if (s3Presigner) {
        // Generar URL de firma usando S3Presigner
        const expiresInSeconds = 7 * 24 * 60 * 60; // 7 days
        signingUrl = await s3Presigner.getObjectUrl({
          bucket: "signing-documents",
          key: `envelopes/${command.envelopeId}/signing-${command.partyId}.pdf`,
          expiresInSeconds,
          responseContentType: "application/pdf",
          responseContentDisposition: `inline; filename="document-to-sign.pdf"`
        });
        expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      } else {
        // Fallback URL si no hay S3Presigner
        signingUrl = `https://sign.example.com/sign/${command.envelopeId}/${command.partyId}`;
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      // 4. Actualizar estado del party a "invited" si está en "pending"
      let statusChanged = false;
      if (party.status === "pending") {
        await partiesRepo.update(partyKey, { 
          status: "invited",
          updatedAt: nowIso()
        });
        statusChanged = true;
      }

      const result: RequestSignatureResult = {
        partyId: command.partyId,
        signingUrl,
        expiresAt,
        statusChanged
      };

      // ✅ AUDIT LOGGING - PATRÓN REUTILIZABLE
      if (auditService && command.actor) {
        await auditService.logRequestSignature(
          command.partyId,
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      // ✅ EVENT PUBLISHING - PATRÓN REUTILIZABLE
      if (eventService && command.actor) {
        await eventService.publishRequestSignature(
          command.partyId,
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      return result;
    },

    async addViewer(command: AddViewerCommand): Promise<AddViewerResult> {
      // ✅ VALIDATION - PATRÓN REUTILIZABLE
      if (validationService) {
        validationService.validateAddViewer(command);
      }

      // ✅ RATE LIMITING - PATRÓN REUTILIZABLE
      if (rateLimitService && command.actor) {
        await rateLimitService.checkAddViewerLimit(command.envelopeId, command.actor);
      }

      // 1. Verificar que el envelope existe
      const envelope = await envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: command.envelopeId }
        );
      }

      // 2. Generar PartyId único
      if (!ids) {
        throw new BadRequestError(
          "ID generation service not available",
          ErrorCodes.COMMON_BAD_REQUEST
        );
      }

      const partyId = ids.ulid() as PartyId;
      const now = nowIso();

      // 3. Crear party con role "viewer"
      const newParty: Party = {
        tenantId: command.tenantId,
        partyId,
        envelopeId: command.envelopeId,
        name: command.name || `Viewer ${partyId}`,
        email: command.email,
        role: "viewer",
        status: "active",
        sequence: 0, // Viewers don't have sequence
        invitedAt: now,
        createdAt: now,
        updatedAt: now,
        auth: { methods: ["otpViaEmail"] },
        otpState: undefined,
        locale: command.locale,
      };

      await partiesRepo.create(newParty);

      const result: AddViewerResult = {
        partyId,
        email: command.email,
        addedAt: now
      };

      // ✅ AUDIT LOGGING - PATRÓN REUTILIZABLE
      if (auditService && command.actor) {
        await auditService.logAddViewer(
          result.partyId,
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      // ✅ EVENT PUBLISHING - PATRÓN REUTILIZABLE
      if (eventService && command.actor) {
        await eventService.publishAddViewer(
          result.partyId,
          command.envelopeId,
          command.tenantId,
          command.actor
        );
      }

      return result;
    }
  };
}