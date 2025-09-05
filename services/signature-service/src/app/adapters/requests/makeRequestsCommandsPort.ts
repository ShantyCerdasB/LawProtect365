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

// Helper function types
type ValidationService = DefaultRequestsValidationService;
type AuditService = DefaultRequestsAuditService;
type EventService = DefaultRequestsEventService;
type RateLimitService = DefaultRequestsRateLimitService;

/**
 * Helper function to validate and get envelope
 */
async function validateAndGetEnvelope(
  envelopesRepo: Repository<Envelope, EnvelopeId, undefined>,
  envelopeId: EnvelopeId
): Promise<Envelope> {
  const envelope = await envelopesRepo.getById(envelopeId);
  if (!envelope) {
    throw new NotFoundError(
      "Envelope not found",
      ErrorCodes.COMMON_NOT_FOUND,
      { envelopeId }
    );
  }
  return envelope;
}

/**
 * Helper function to execute common service operations
 */
async function executeCommonServices(
  validationService: ValidationService | undefined,
  rateLimitService: RateLimitService | undefined,
  _auditService: AuditService | undefined,
  _eventService: EventService | undefined,
  command: any,
  operation: string
): Promise<void> {
  // Basic validation
  if (validationService && command.actor) {
    (validationService as any)[`validate${operation}`](command);
  }

  // Input-specific validations
  if (validationService) {
    await executeInputValidations(validationService, command, operation);
  }

  // Rate limiting
  if (rateLimitService && command.actor) {
    const rateLimitMethod = `check${operation}Limit`;
    if (typeof (rateLimitService as any)[rateLimitMethod] === 'function') {
      await (rateLimitService as any)[rateLimitMethod](command.envelopeId, command.actor);
    }
  }
}

/**
 * Helper function to execute input-specific validations
 */
async function executeInputValidations(
  validationService: ValidationService,
  command: any,
  operation: string
): Promise<void> {
  switch (operation) {
    case "InviteParties":
      await (validationService as any).validateEnvelopeHasInputs(command.envelopeId);
      break;
    case "FinaliseEnvelope":
      await (validationService as any).validateRequiredInputsComplete(command.envelopeId);
      break;
    case "RequestSignature":
      await (validationService as any).validatePartyHasAssignedInputs(command.envelopeId, command.partyId);
      break;
    // Add more cases as needed
  }
}

/**
 * Helper function to publish audit and events
 */
async function publishAuditAndEvents(
  auditService: AuditService | undefined,
  eventService: EventService | undefined,
  command: any,
  result: any,
  operation: string
): Promise<void> {
  // Audit logging
  if (auditService && command.actor) {
    const auditMethod = `log${operation}`;
    if (typeof (auditService as any)[auditMethod] === 'function') {
      await (auditService as any)[auditMethod](
        result,
        command.envelopeId,
        command.tenantId,
        command.actor
      );
    }
  }

  // Event publishing
  if (eventService && command.actor) {
    const eventMethod = `publish${operation}`;
    if (typeof (eventService as any)[eventMethod] === 'function') {
      await (eventService as any)[eventMethod](
        result,
        command.envelopeId,
        command.tenantId,
        command.actor
      );
    }
  }
}

/**
 * Helper function to create a new party
 */
async function createNewParty(
  partyId: PartyId,
  command: InvitePartiesCommand,
  partiesRepo: Repository<Party, PartyKey, undefined>
): Promise<void> {
  const now = nowIso();
  const newParty: Party = {
    tenantId: command.tenantId,
    partyId,
    envelopeId: command.envelopeId,
    name: `Party ${partyId}`,
    email: `party-${partyId}@example.com`,
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
}

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
  _inputsRepo: Repository<Input, InputKey, undefined>,
  // ✅ SERVICIOS OPCIONALES - PATRÓN REUTILIZABLE
  validationService?: DefaultRequestsValidationService,
  auditService?: DefaultRequestsAuditService,
  eventService?: DefaultRequestsEventService,
  rateLimitService?: DefaultRequestsRateLimitService,
  // ✅ SERVICIOS DE INFRAESTRUCTURA - PATRÓN REUTILIZABLE
  ids?: { ulid(): string },
  s3Presigner?: S3Presigner
): RequestsCommandsPort {
  
  // Note: _inputsRepo parameter is reserved for future input-related operations
  
  return {
    async inviteParties(command: InvitePartiesCommand): Promise<InvitePartiesResult> {
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "InviteParties");

      // Get and validate envelope
      const envelope = await validateAndGetEnvelope(envelopesRepo, command.envelopeId);
      
      if (envelope.status !== "draft") {
        throw new ConflictError(
          "Envelope must be in draft state to invite parties",
          ErrorCodes.COMMON_CONFLICT,
          { envelopeId: command.envelopeId, currentStatus: envelope.status }
        );
      }

      // Process each party
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
          if (!ids) {
            throw new BadRequestError(
              "ID generation service not available",
              ErrorCodes.COMMON_BAD_REQUEST
            );
          }

          const newPartyId = ids.ulid() as PartyId;
          await createNewParty(newPartyId, command, partiesRepo);
          invited.push(newPartyId);
        }
      }

      // Update envelope status if needed
      let statusChanged = false;
      if (invited.length > 0 && envelope.status === "draft") {
        try {
          assertLifecycleTransition(envelope.status, "sent");
          await envelopesRepo.update(command.envelopeId, { status: "sent" });
          statusChanged = true;
        } catch {
          console.warn("Could not transition envelope to sent status");
        }
      }

      const result: InvitePartiesResult = {
        invited,
        alreadyPending,
        skipped,
        statusChanged
      };

      // Publish audit and events
      await publishAuditAndEvents(auditService, eventService, command, result.invited, "InviteParties");

      return result;
    },

    async remindParties(command: RemindPartiesCommand): Promise<RemindPartiesResult> {
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "RemindParties");

      // Get and validate envelope
      const envelope = await validateAndGetEnvelope(envelopesRepo, command.envelopeId);
      
      if (envelope.status !== "sent" && envelope.status !== "in_progress") {
        throw new ConflictError(
          `Cannot send reminders for envelope in ${envelope.status} state`,
          ErrorCodes.COMMON_CONFLICT,
          { envelopeId: command.envelopeId, currentStatus: envelope.status }
        );
      }

      // Process each party
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

      // Publish audit and events
      await publishAuditAndEvents(auditService, eventService, command, result.reminded, "RemindParties");

      return result;
    },

    async cancelEnvelope(command: CancelEnvelopeCommand): Promise<CancelEnvelopeResult> {
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "CancelEnvelope");

      // Get and validate envelope
      const envelope = await validateAndGetEnvelope(envelopesRepo, command.envelopeId);
      
      // Validate state transition
      try {
        assertLifecycleTransition(envelope.status, "canceled");
      } catch {
        throw new ConflictError(
          `Cannot cancel envelope in ${envelope.status} state`,
          ErrorCodes.COMMON_CONFLICT,
          { envelopeId: command.envelopeId, currentStatus: envelope.status }
        );
      }

      // Update envelope status
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

      // Publish audit and events
      await publishAuditAndEvents(auditService, eventService, command, result, "CancelEnvelope");

      return result;
    },

    async declineEnvelope(command: DeclineEnvelopeCommand): Promise<DeclineEnvelopeResult> {
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "DeclineEnvelope");

      // Get and validate envelope
      const envelope = await validateAndGetEnvelope(envelopesRepo, command.envelopeId);
      
      // Validate state transition
      try {
        assertLifecycleTransition(envelope.status, "declined");
      } catch {
        throw new ConflictError(
          `Cannot decline envelope in ${envelope.status} state`,
          ErrorCodes.COMMON_CONFLICT,
          { envelopeId: command.envelopeId, currentStatus: envelope.status }
        );
      }

      // Update envelope status
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

      // Publish audit and events
      await publishAuditAndEvents(auditService, eventService, command, result, "DeclineEnvelope");

      return result;
    },

    async finaliseEnvelope(command: FinaliseEnvelopeCommand): Promise<FinaliseEnvelopeResult> {
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "FinaliseEnvelope");

      // Get and validate envelope
      const envelope = await validateAndGetEnvelope(envelopesRepo, command.envelopeId);
      
      if (envelope.status !== "completed") {
        throw new ConflictError(
          `Cannot finalize envelope in ${envelope.status} state. Must be completed.`,
          ErrorCodes.COMMON_CONFLICT,
          { envelopeId: command.envelopeId, currentStatus: envelope.status }
        );
      }

      // Generate artifacts (PDFs, certificates, etc.)
      const artifactIds: string[] = [];
      if (s3Presigner && ids) {
        // Generate final envelope PDF
        const pdfArtifactId = ids.ulid();
        await s3Presigner.getObjectUrl({
          bucket: "envelope-artifacts",
          key: `envelopes/${command.envelopeId}/final-${pdfArtifactId}.pdf`,
          expiresInSeconds: 7 * 24 * 60 * 60, // 7 days
          responseContentType: "application/pdf",
          responseContentDisposition: `attachment; filename="envelope-${command.envelopeId}.pdf"`
        });
        artifactIds.push(pdfArtifactId);

        // Generate completion certificate
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

      // Update envelope status to "finalized"
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

      // Publish audit and events
      await publishAuditAndEvents(auditService, eventService, command, result, "FinaliseEnvelope");

      return result;
    },

    async requestSignature(command: RequestSignatureCommand): Promise<RequestSignatureResult> {
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "RequestSignature");

      // Get and validate party
      const partyKey = { envelopeId: command.envelopeId, partyId: command.partyId };
      const party = await partiesRepo.getById(partyKey);
      if (!party) {
        throw new NotFoundError(
          "Party not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: command.envelopeId, partyId: command.partyId }
        );
      }

      if (party.status !== "pending" && party.status !== "invited") {
        throw new ConflictError(
          `Cannot request signature from party in ${party.status} state`,
          ErrorCodes.COMMON_CONFLICT,
          { partyId: command.partyId, currentStatus: party.status }
        );
      }

      // Generate signing URL
      let signingUrl = "";
      let expiresAt = "";
      
      if (s3Presigner) {
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
        // Fallback URL if no S3Presigner
        signingUrl = `https://sign.example.com/sign/${command.envelopeId}/${command.partyId}`;
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Update party status if needed
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

      // Publish audit and events
      await publishAuditAndEvents(auditService, eventService, command, result, "RequestSignature");

      return result;
    },

    async addViewer(command: AddViewerCommand): Promise<AddViewerResult> {
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "AddViewer");

      // Verify envelope exists
      await validateAndGetEnvelope(envelopesRepo, command.envelopeId);

      // Generate unique PartyId
      if (!ids) {
        throw new BadRequestError(
          "ID generation service not available",
          ErrorCodes.COMMON_BAD_REQUEST
        );
      }

      const partyId = ids.ulid() as PartyId;
      const now = nowIso();

      // Create party with "viewer" role
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

      // Publish audit and events
      await publishAuditAndEvents(auditService, eventService, command, result, "AddViewer");

      return result;
    }
  };
}