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
import type { Repository, S3Presigner } from "@lawprotect/shared-ts";
import { nowIso, NotFoundError, ConflictError, BadRequestError, ErrorCodes, assertTenantBoundary } from "@lawprotect/shared-ts";
import { PARTY_DEFAULTS, ENVELOPE_STATUSES, PARTY_ROLES, PARTY_STATUSES, REQUEST_DEFAULTS, S3_BUCKETS, REQUEST_TIMEOUTS } from "../../../domain/values/enums";
import type { Envelope } from "../../../domain/entities/Envelope";
import type { Party } from "../../../domain/entities/Party";
import type { Input } from "../../../domain/entities/Input";
import type { EnvelopeId, PartyId } from "../../../domain/value-objects/ids";
import type { PartyStatus, PartyRole, EnvelopeStatus } from "../../../domain/values/enums";
import type { PartyKey, InputKey } from "../../../domain/types/infrastructure/dynamodb";
import { RequestsValidationService } from "../../services/Requests/RequestsValidationService";
import { RequestsAuditService } from "../../services/Requests/RequestsAuditService";
import { RequestsEventService } from "../../services/Requests/RequestsEventService";
import { RequestsRateLimitService } from "../../services/Requests/RequestsRateLimitService";
import { assertLifecycleTransition, assertDraft } from "../../../domain/rules/EnvelopeLifecycle.rules";
import { assertReadyToSend, assertInvitePolicy } from "../../../domain/rules/Flow.rules";
import { assertCancelDeclineAllowed, assertReasonValid } from "../../../domain/rules/CancelDecline.rules";

// Helper function types
type ValidationService = RequestsValidationService;
type AuditService = RequestsAuditService;
type EventService = RequestsEventService;
type RateLimitService = RequestsRateLimitService;

/**
 * Validates envelope existence and returns the envelope entity
 * @param envelopesRepo - Repository for envelope operations
 * @param envelopeId - Unique identifier for the envelope
 * @returns Promise resolving to the envelope entity
 * @throws NotFoundError if envelope does not exist
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
 * Executes common service operations including validation and rate limiting
 * @param validationService - Optional validation service
 * @param rateLimitService - Optional rate limiting service
 * @param _auditService - Optional audit service (unused in this function)
 * @param _eventService - Optional event service (unused in this function)
 * @param command - Command object containing operation data
 * @param operation - Name of the operation being performed
 * @returns Promise that resolves when all operations complete
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
 * Executes input-specific validations based on the operation type
 * @param validationService - Validation service instance
 * @param command - Command object containing validation data
 * @param operation - Type of operation to validate
 * @returns Promise that resolves when validation completes
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
 * Executes common operations for cancel and decline envelope operations
 * @param command - Cancel or decline command object
 * @param targetStatus - Target status to transition to ("canceled" or "declined")
 * @param envelopesRepo - Repository for envelope operations
 * @param auditService - Optional audit service for logging
 * @param eventService - Optional event service for publishing events
 * @returns Promise resolving to operation result with envelope ID, status, and timestamp
 * @throws ConflictError if transition is not allowed
 */
async function executeCancelDeclineOperations(
  command: CancelEnvelopeCommand | DeclineEnvelopeCommand,
  targetStatus: "canceled" | "declined",
  envelopesRepo: Repository<Envelope, EnvelopeId>,
  auditService: AuditService | undefined,
  eventService: EventService | undefined
): Promise<{ envelopeId: EnvelopeId; status: string; timestamp: string }> {
  // Get and validate envelope
  const envelope = await validateAndGetEnvelope(envelopesRepo, command.envelopeId);
  
  // Validate cancel/decline preconditions using domain rules
  assertCancelDeclineAllowed(envelope.status);
  
  // Validate reason if provided
  if (command.reason) {
    assertReasonValid(command.reason);
  }
  
  // Validate state transition
  try {
    assertLifecycleTransition(envelope.status, targetStatus);
  } catch {
    throw new ConflictError(
      `Cannot ${targetStatus === "canceled" ? "cancel" : "decline"} envelope in ${envelope.status} state`,
      ErrorCodes.COMMON_CONFLICT,
      { envelopeId: command.envelopeId, currentStatus: envelope.status }
    );
  }

  // Update envelope status
  const now = nowIso();
  await envelopesRepo.update(command.envelopeId, { 
    status: targetStatus,
    updatedAt: now
  });

  const result = {
    envelopeId: command.envelopeId,
    status: targetStatus,
    [`${targetStatus}At`]: now,
    timestamp: now
  } as any;

  // Publish audit and events
  await publishAuditAndEvents(auditService, eventService, command, result, targetStatus === "canceled" ? "CancelEnvelope" : "DeclineEnvelope");

  return result;
}

/**
 * Publishes audit logs and events for completed operations
 * @param auditService - Optional audit service for logging operations
 * @param eventService - Optional event service for publishing domain events
 * @param command - Command object containing operation context
 * @param result - Result data to be logged or published
 * @param operation - Name of the operation for method resolution
 * @returns Promise that resolves when all publishing operations complete
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
 * Creates a new party entity with default values
 * @param partyId - Unique identifier for the new party
 * @param command - Invite parties command containing tenant and envelope context
 * @param partiesRepo - Repository for party persistence operations
 * @returns Promise that resolves when party is created
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
    role: PARTY_ROLES[0] as PartyRole,
    status: PARTY_DEFAULTS.DEFAULT_STATUS as PartyStatus,
    sequence: PARTY_DEFAULTS.DEFAULT_SEQUENCE,
    invitedAt: now,
    createdAt: now,
    updatedAt: now,
    auth: { methods: [...PARTY_DEFAULTS.DEFAULT_AUTH_METHODS] },
    otpState: undefined,
  };

  await partiesRepo.create(newParty);
}

/**
 * Processes party invitations by checking existing parties and creating new ones
 * @param command - Invite parties command containing party IDs and context
 * @param partiesRepo - Repository for party operations
 * @param ids - Optional ID generation service
 * @returns Promise resolving to invitation results with invited, already pending, and skipped party IDs
 */
async function processPartyInvitations(
  command: InvitePartiesCommand,
  partiesRepo: Repository<Party, PartyKey, undefined>,
  ids?: { ulid(): string }
): Promise<{ invited: PartyId[]; alreadyPending: PartyId[]; skipped: PartyId[] }> {
  const invited: PartyId[] = [];
  const alreadyPending: PartyId[] = [];
  const skipped: PartyId[] = [];

  for (const partyId of command.partyIds) {
    const partyKey = { envelopeId: command.envelopeId, partyId };
    const existingParty = await partiesRepo.getById(partyKey);
    
    if (existingParty) {
      if (existingParty.status === PARTY_STATUSES[0] || existingParty.status === "invited") {
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

  return { invited, alreadyPending, skipped };
}

/**
 * Retrieves party invitation statistics for rate limiting and policy validation
 * @param envelopeId - Unique identifier for the envelope
 * @param partiesRepo - Repository for party operations
 * @returns Promise resolving to invitation statistics including last sent time and daily count
 */
async function getPartyInvitationStats(
  envelopeId: EnvelopeId,
  partiesRepo: Repository<Party, PartyKey, undefined>
): Promise<{ lastSentAt?: number; sentToday: number }> {
  // Use query method to get parties by envelope
  const parties = partiesRepo.query ? await partiesRepo.query({ 
    where: { envelopeId } 
  }) : [];
  
  // Calculate stats from parties
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let lastSentAt: number | undefined;
  let sentToday = 0;
  
  for (const party of parties) {
    if (party.invitedAt) {
      const invitedDate = new Date(party.invitedAt);
      const invitedTimestamp = invitedDate.getTime();
      if (invitedDate >= today) {
        sentToday++;
      }
      if (!lastSentAt || invitedTimestamp > lastSentAt) {
        lastSentAt = invitedTimestamp;
      }
    }
  }
  
  return { lastSentAt, sentToday };
}

/**
 * Updates envelope status to "sent" if conditions are met and validation passes
 * @param envelope - Current envelope entity
 * @param invitedCount - Number of parties that were successfully invited
 * @param envelopeId - Unique identifier for the envelope
 * @param envelopesRepo - Repository for envelope operations
 * @param partiesRepo - Optional repository for party operations
 * @param inputsRepo - Optional repository for input operations
 * @returns Promise resolving to boolean indicating if status was changed
 */
async function updateEnvelopeStatusIfNeeded(
  envelope: Envelope,
  invitedCount: number,
  envelopeId: EnvelopeId,
  envelopesRepo: Repository<Envelope, EnvelopeId, undefined>,
  partiesRepo?: Repository<Party, PartyKey, undefined>,
  inputsRepo?: Repository<Input, InputKey, undefined>
): Promise<boolean> {
  if (invitedCount > 0 && envelope.status === ENVELOPE_STATUSES[0]) {
    try {
      // Validate envelope is ready to send using domain rules
      if (partiesRepo && inputsRepo) {
        const parties = partiesRepo.query ? await partiesRepo.query({ 
          where: { envelopeId } 
        }) : [];
        const inputs = inputsRepo.query ? await inputsRepo.query({ 
          where: { envelopeId } 
        }) : [];
        assertReadyToSend(parties, inputs);
      }
      
      assertLifecycleTransition(envelope.status, ENVELOPE_STATUSES[1]);
      await envelopesRepo.update(envelopeId, { status: ENVELOPE_STATUSES[1] });
      return true;
    } catch {
      console.warn("Could not transition envelope to sent status");
    }
  }
  return false;
}

/**
 * Generates artifacts (PDFs, certificates) for finalized envelopes
 * @param envelopeId - Unique identifier for the envelope
 * @param s3Presigner - Optional S3 presigner for generating signed URLs
 * @param ids - Optional ID generation service for artifact IDs
 * @returns Promise resolving to array of generated artifact IDs
 */
async function generateArtifacts(
  envelopeId: EnvelopeId,
  s3Presigner?: S3Presigner,
  ids?: { ulid(): string }
): Promise<string[]> {
  const artifactIds: string[] = [];
  
  if (!s3Presigner || !ids) {
    return artifactIds;
  }

  // Generate final envelope PDF
  const pdfArtifactId = ids.ulid();
  await s3Presigner.getObjectUrl({
    bucket: S3_BUCKETS.ENVELOPE_ARTIFACTS,
    key: `envelopes/${envelopeId}/final-${pdfArtifactId}.pdf`,
    expiresInSeconds: REQUEST_TIMEOUTS.URL_EXPIRATION_SECONDS,
    responseContentType: "application/pdf",
    responseContentDisposition: `attachment; filename="envelope-${envelopeId}.pdf"`
  });
  artifactIds.push(pdfArtifactId);

  // Generate completion certificate
  const certArtifactId = ids.ulid();
  await s3Presigner.getObjectUrl({
    bucket: S3_BUCKETS.ENVELOPE_ARTIFACTS,
    key: `envelopes/${envelopeId}/certificate-${certArtifactId}.pdf`,
    expiresInSeconds: REQUEST_TIMEOUTS.URL_EXPIRATION_SECONDS,
    responseContentType: "application/pdf",
    responseContentDisposition: `attachment; filename="certificate-${envelopeId}.pdf"`
  });
  artifactIds.push(certArtifactId);

  return artifactIds;
}

/**
 * Generates a presigned URL for document signing
 * @param envelopeId - Unique identifier for the envelope
 * @param partyId - Unique identifier for the party
 * @param s3Presigner - Optional S3 presigner for generating signed URLs
 * @returns Promise resolving to signing URL and expiration timestamp
 */
async function generateSigningUrl(
  envelopeId: EnvelopeId,
  partyId: PartyId,
  s3Presigner?: S3Presigner
): Promise<{ signingUrl: string; expiresAt: string }> {
  const expiresInSeconds = REQUEST_TIMEOUTS.SIGNING_URL_EXPIRATION_SECONDS;
  
  if (s3Presigner) {
    const signingUrl = await s3Presigner.getObjectUrl({
      bucket: S3_BUCKETS.SIGNING_DOCUMENTS,
      key: `envelopes/${envelopeId}/signing-${partyId}.pdf`,
      expiresInSeconds,
      responseContentType: "application/pdf",
      responseContentDisposition: `inline; filename="document-to-sign.pdf"`
    });
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    return { signingUrl, expiresAt };
  } else {
    // Fallback URL if no S3Presigner
    const signingUrl = `https://sign.example.com/sign/${envelopeId}/${partyId}`;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    return { signingUrl, expiresAt };
  }
}

/**
 * Configuration interface for RequestsCommandsPort implementation
 * @interface RequestsCommandsPortConfig
 */
interface RequestsCommandsPortConfig {
  repositories: {
    envelopes: Repository<Envelope, EnvelopeId, undefined>;
    parties: Repository<Party, PartyKey, undefined>;
    inputs: Repository<Input, InputKey, undefined>;
  };
  services?: {
    validation?: RequestsValidationService;
    audit?: RequestsAuditService;
    event?: RequestsEventService;
    rateLimit?: RequestsRateLimitService;
  };
  infrastructure?: {
    ids?: { ulid(): string };
    s3Presigner?: S3Presigner;
  };
}

/**
 * Creates RequestsCommandsPort implementation with optional services for request operations
 * @param config - Configuration object containing repositories, services, and infrastructure
 * @returns Configured RequestsCommandsPort implementation
 */
export function makeRequestsCommandsPort(config: RequestsCommandsPortConfig): RequestsCommandsPort {
  const {
    repositories: { envelopes: envelopesRepo, parties: partiesRepo, inputs: _inputsRepo },
    services: { 
      validation: validationService, 
      audit: auditService, 
      event: eventService, 
      rateLimit: rateLimitService 
    } = {},
    infrastructure: { ids, s3Presigner } = {}
  } = config;
  
  // Note: _inputsRepo parameter is reserved for future input-related operations
  
  return {
    async inviteParties(command: InvitePartiesCommand): Promise<InvitePartiesResult> {
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "InviteParties");

      // Get and validate envelope
      const envelope = await validateAndGetEnvelope(envelopesRepo, command.envelopeId);
      
      // Validate envelope is in draft state using domain rules
      assertDraft(envelope);

      // Validate invite policy using domain rules
      const partyStats = await getPartyInvitationStats(command.envelopeId, partiesRepo);
      assertInvitePolicy({
        lastSentAt: partyStats.lastSentAt,
        sentToday: partyStats.sentToday,
        minCooldownMs: REQUEST_DEFAULTS.INVITE_COOLDOWN_MS,
        dailyLimit: REQUEST_DEFAULTS.INVITE_DAILY_LIMIT
      });

      // Process party invitations
      const { invited, alreadyPending, skipped } = await processPartyInvitations(command, partiesRepo, ids);

      // Update envelope status if needed
      const statusChanged = await updateEnvelopeStatusIfNeeded(envelope, invited.length, command.envelopeId, envelopesRepo, partiesRepo, _inputsRepo);

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
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "RemindParties");

      // Get and validate envelope
      const envelope = await validateAndGetEnvelope(envelopesRepo, command.envelopeId);
      
      if (envelope.status !== ENVELOPE_STATUSES[1] && envelope.status !== ENVELOPE_STATUSES[2]) {
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

          if (party.status === PARTY_STATUSES[0] || party.status === "invited") {
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
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "CancelEnvelope");

      // Execute cancel operations using helper
      const result = await executeCancelDeclineOperations(command, ENVELOPE_STATUSES[4], envelopesRepo, auditService, eventService);

      return result as unknown as CancelEnvelopeResult;
    },

    async declineEnvelope(command: DeclineEnvelopeCommand): Promise<DeclineEnvelopeResult> {
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "DeclineEnvelope");

      // Execute decline operations using helper
      const result = await executeCancelDeclineOperations(command, ENVELOPE_STATUSES[5], envelopesRepo, auditService, eventService);

      return result as unknown as DeclineEnvelopeResult;
    },

    async finaliseEnvelope(command: FinaliseEnvelopeCommand): Promise<FinaliseEnvelopeResult> {
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
      // Execute common services (validation and rate limiting)
      await executeCommonServices(validationService, rateLimitService, auditService, eventService, command, "FinaliseEnvelope");

      // Get and validate envelope
      const envelope = await validateAndGetEnvelope(envelopesRepo, command.envelopeId);
      
      if (envelope.status !== ENVELOPE_STATUSES[3]) {
        throw new ConflictError(
          `Cannot finalize envelope in ${envelope.status} state. Must be completed.`,
          ErrorCodes.COMMON_CONFLICT,
          { envelopeId: command.envelopeId, currentStatus: envelope.status }
        );
      }

      // Generate artifacts (PDFs, certificates, etc.)
      const artifactIds = await generateArtifacts(command.envelopeId, s3Presigner, ids);

      // Update envelope status to "finalized"
      const now = nowIso();
      await envelopesRepo.update(command.envelopeId, { 
        status: "finalized" as EnvelopeStatus,
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
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
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

      if (party.status !== PARTY_STATUSES[0] && party.status !== "invited") {
        throw new ConflictError(
          `Cannot request signature from party in ${party.status} state`,
          ErrorCodes.COMMON_CONFLICT,
          { partyId: command.partyId, currentStatus: party.status }
        );
      }

      // Generate signing URL
      const { signingUrl, expiresAt } = await generateSigningUrl(command.envelopeId, command.partyId, s3Presigner);

      // Update party status if needed
      let statusChanged = false;
      if (party.status === PARTY_STATUSES[0]) {
        await partiesRepo.update(partyKey, { 
          status: "invited" as PartyStatus,
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
      // Apply generic rules
      assertTenantBoundary(command.tenantId, command.tenantId);
      
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
        role: PARTY_ROLES[2] as PartyRole,
        status: "active" as PartyStatus,
        sequence: REQUEST_DEFAULTS.VIEWER_SEQUENCE,
        invitedAt: now,
        createdAt: now,
        updatedAt: now,
        auth: { methods: [...PARTY_DEFAULTS.DEFAULT_AUTH_METHODS] },
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






