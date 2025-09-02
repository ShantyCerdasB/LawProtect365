/**
 * @file MakeConsentCommandsPort.ts
 * @summary App adapter: ConsentRepository → ConsentCommandsPort (create/update/delete/submit/delegate)
 * @description Bridges the infra repository to the app commands port for all consent operations.
 * Handles ID generation, enum validation, and provides complete ConsentCommandsPort implementation.
 */

import type { ConsentCommandsPort } from "../../ports/consent/ConsentCommandsPort";
import type { 
  CreateConsentAppInput, 
  CreateConsentAppResult,
  UpdateConsentAppInput,
  UpdateConsentAppResult,
  DeleteConsentAppInput,
  SubmitConsentAppInput,
  SubmitConsentAppResult,
  DelegateConsentAppInput,
  DelegateConsentAppResult
} from "../../../shared/types/consent/AppServiceInputs";
import type {
  ConsentRepoRow,
  ConsentRepoUpdateInput,
} from "../../../shared/types/consent/ConsentTypes";
import type { ConsentCommandRepo, Ids } from "../../../shared/types/consent/AdapterDependencies";
import type { ConsentId, EnvelopeId, PartyId } from "../../../domain/value-objects/Ids";
import type { ConsentStatus, ConsentType } from "../../../domain/values/enums";
import { nowIso, asISO, asISOOpt } from "@lawprotect/shared-ts";
import { NotFoundError } from "../../../shared/errors";
import { mapConsentRowToResult } from "../../../shared/types/consent/ConsentTypes";
import type { DelegationRepositoryDdb } from "../../../infrastructure/dynamodb/DelegationRepositoryDdb";
import type { PartyConsentService } from "../../services/Consent/PartyConsentService";
import type { ConsentValidationService } from "../../services/Consent/ConsentValidationService";
import type { ConsentAuditService } from "../../services/Consent/ConsentAuditService";
import type { ConsentEventService } from "../../services/Consent/ConsentEventService";
import type { UserId } from "@lawprotect/shared-ts";
import type { ActorContext } from "../../../domain/entities/ActorContext";
import type { IdempotencyRunner } from "../../../infrastructure/idempotency/IdempotencyRunner";

/**
 * @summary Maps a repository row to an update result
 * @description Converts a repository row to the domain update result format
 *
 * @param {ConsentRepoRow} r - Repository row from database
 * @returns {UpdateConsentAppResult} Domain update result record
 */
const mapRowToUpdateResult = (r: ConsentRepoRow): UpdateConsentAppResult => ({
  id: r.consentId as ConsentId,
  envelopeId: r.envelopeId as EnvelopeId,
  partyId: r.partyId as PartyId,
  type: r.consentType as ConsentType,
  status: r.status as ConsentStatus,
  createdAt: r.createdAt || "",
  updatedAt: r.updatedAt || "",
  expiresAt: r.expiresAt,
  metadata: r.metadata,
});

/**
 * @summary Maps a repository row to a submit result
 * @description Converts a repository row to the domain submit result format
 *
 * @param {ConsentRepoRow} r - Repository row from database
 * @returns {SubmitConsentAppResult} Domain submit result record
 */
const mapRowToSubmitResult = (r: ConsentRepoRow): SubmitConsentAppResult => ({
  id: r.consentId as ConsentId,
  envelopeId: r.envelopeId as EnvelopeId,
  partyId: r.partyId as PartyId,
  type: r.consentType as ConsentType,
  status: r.status as ConsentStatus,
  submittedAt: r.updatedAt || r.createdAt || "",
  metadata: r.metadata,
});

/**
 * @summary Creates a ConsentCommandsPort implementation
 * @description Factory function that creates a complete ConsentCommandsPort implementation
 * by bridging the infrastructure repository to the application port interface.
 * Handles all consent command operations with proper validation and type safety.
 *
 * @param {ConsentCommandRepo} consentsRepo - Repository implementation for consent operations
 * @param {Ids} ids - ID generation service
 * @returns {ConsentCommandsPort} Complete ConsentCommandsPort implementation
 */
export function makeConsentCommandsPort(
  consentsRepo: ConsentCommandRepo,
  delegationsRepo: DelegationRepositoryDdb,
  ids: Ids,
  partyConsentService: PartyConsentService,
  validationService: ConsentValidationService,
  auditService: ConsentAuditService,
  eventService: ConsentEventService,
  idempotencyRunner: IdempotencyRunner
): ConsentCommandsPort {
  // Helper function for delegation logic
  async function performDelegation(input: DelegateConsentAppInput, actorContext?: ActorContext): Promise<DelegateConsentAppResult> {
    // 1. VALIDATION
    if (validationService) {
      await validationService.validateConsentDelegation({
        tenantId: input.tenantId,
        envelopeId: input.envelopeId,
        consentId: input.consentId,
        delegateEmail: input.delegateEmail,
        delegateName: input.delegateName
      });
    }

    // 2. Get current consent to obtain originalPartyId
    const currentConsent = await consentsRepo.getById({
      envelopeId: input.envelopeId,
      consentId: input.consentId
    });
    
    if (!currentConsent) {
      throw new NotFoundError('Consent not found', undefined, { consentId: input.consentId });
    }

    // 3. CREATE/FIND DELEGATE PARTY
    let delegatePartyId: PartyId;
    if (partyConsentService) {
      delegatePartyId = await partyConsentService.findOrCreatePartyForDelegate({
        tenantId: input.tenantId,
        email: input.delegateEmail,
        name: input.delegateName
      });
    } else {
      // Fallback: generate a new party ID if service is not available
      delegatePartyId = ids.ulid() as PartyId;
    }

    // 4. Create delegation record
    const delegation = await delegationsRepo.create({
      delegationId: ids.ulid(),
      tenantId: input.tenantId,
      consentId: input.consentId,
      envelopeId: input.envelopeId,
      originalPartyId: currentConsent.partyId,
      delegatePartyId: delegatePartyId,
      reason: input.reason,
      status: "pending",
      expiresAt: input.expiresAt ? asISOOpt(input.expiresAt) : undefined,
      metadata: input.metadata,
    });

    // 5. Update consent status to delegated
    await consentsRepo.update(
      { envelopeId: input.envelopeId, consentId: input.consentId },
      { 
        status: "delegated" as ConsentStatus,
        updatedAt: asISO(nowIso())
      }
    );

    // 6. AUDIT - Use actor context if available, fallback to system context
    if (auditService) {
      const auditContext = {
        tenantId: input.tenantId,
        envelopeId: input.envelopeId,
        actor: actorContext || { 
          userId: "system" as UserId, 
          email: "system@lawprotect.com" 
        }
      };
      
      await auditService.logConsentDelegation(auditContext, {
        consentId: input.consentId,
        originalPartyId: currentConsent.partyId as PartyId,
        delegatePartyId: delegatePartyId as PartyId,
        delegationId: delegation.delegationId,
        reason: input.reason,
        expiresAt: input.expiresAt,
        metadata: input.metadata,
      });
    }

    // 7. EVENTS
    if (eventService) {
      const consentDelegatedEvent = {
        type: "consent.delegated" as const,
        payload: {
          tenantId: input.tenantId,
          consentId: input.consentId,
          envelopeId: input.envelopeId,
          originalPartyId: currentConsent.partyId as PartyId,
          delegatePartyId: delegatePartyId as PartyId,
          delegationId: delegation.delegationId,
          reason: input.reason,
          expiresAt: input.expiresAt,
          metadata: input.metadata,
        }
      };
      
      await eventService.publishConsentDelegatedEvent(consentDelegatedEvent);
    }

    return {
      id: input.consentId,
      envelopeId: input.envelopeId,
      delegationId: delegation.delegationId,
      delegateEmail: input.delegateEmail,
      delegateName: input.delegateName,
      delegatedAt: delegation.createdAt,
      metadata: input.metadata,
    };
  }

  return {
    /**
     * @summary Creates a new consent
     * @description Creates a new consent record with generated ID and initial pending status.
     * Validates enum values and brands ISO date strings for type safety.
     *
     * @param {CreateConsentAppInput} input - Consent creation parameters
     * @returns {Promise<CreateConsentAppResult>} Promise resolving to the created consent data
     */
    async create(input: CreateConsentAppInput): Promise<CreateConsentAppResult> {
      // Implement idempotency if key is provided
      if (input.idempotencyKey) {
        return idempotencyRunner.run(
          input.idempotencyKey,
          async () => {
            const row = await consentsRepo.create({
              consentId: ids.ulid(),
              tenantId: input.tenantId,
              envelopeId: input.envelopeId,
              partyId: input.partyId,
              consentType: input.type,
              status: input.status,
              metadata: input.metadata,
              expiresAt: asISOOpt(input.expiresAt),
              createdAt: asISO(nowIso()),
            });

            return mapConsentRowToResult(row);
          },
          input.ttlSeconds
        );
      }

      // Fallback to non-idempotent creation
      const row = await consentsRepo.create({
        consentId: ids.ulid(),
        tenantId: input.tenantId,
        envelopeId: input.envelopeId,
        partyId: input.partyId,
        consentType: input.type,
        status: input.status,
        metadata: input.metadata,
        expiresAt: asISOOpt(input.expiresAt),
        createdAt: asISO(nowIso()),
      });

      return mapConsentRowToResult(row);
    },

    /**
     * @summary Updates an existing consent
     * @description Updates a consent record with the provided changes.
     * Validates status enum if provided and brands ISO date strings.
     *
     * @param {UpdateConsentAppInput} input - The consent update parameters
     * @returns {Promise<UpdateConsentAppResult>} Promise resolving to the updated consent data
     */
    async update(input: UpdateConsentAppInput): Promise<UpdateConsentAppResult> {
      // Implement idempotency if key is provided
      if (input.idempotencyKey) {
        return idempotencyRunner.run(
          input.idempotencyKey,
          async () => {
            const changes: ConsentRepoUpdateInput = {
              updatedAt: asISO(nowIso()),
              ...(input.status !== undefined && { status: input.status }),
              ...(input.expiresAt !== undefined && { expiresAt: asISOOpt(input.expiresAt) }),
              ...(input.metadata !== undefined && { metadata: input.metadata }),
            };

            const row = await consentsRepo.update(
              { envelopeId: input.envelopeId, consentId: input.consentId },
              changes
            );

            return mapRowToUpdateResult(row);
          },
          input.ttlSeconds
        );
      }

      // Fallback to non-idempotent update
      const changes: ConsentRepoUpdateInput = {
        updatedAt: asISO(nowIso()),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.expiresAt !== undefined && { expiresAt: asISOOpt(input.expiresAt) }),
        ...(input.metadata !== undefined && { metadata: input.metadata }),
      };

      const row = await consentsRepo.update(
        { envelopeId: input.envelopeId, consentId: input.consentId },
        changes
      );

      return mapRowToUpdateResult(row);
    },

    /**
     * @summary Deletes a consent
     * @description Deletes a consent record from the repository
     *
     * @param {DeleteConsentAppInput} input - The consent deletion parameters
     * @returns {Promise<void>} Promise resolving when deletion is complete
     */
    async delete(input: DeleteConsentAppInput): Promise<void> {
      // Implement idempotency if key is provided
      if (input.idempotencyKey) {
        return idempotencyRunner.run(
          input.idempotencyKey,
          async () => {
            await consentsRepo.delete({ 
              envelopeId: input.envelopeId, 
              consentId: input.consentId 
            });
          },
          input.ttlSeconds
        );
      }

      // Fallback to non-idempotent delete
      await consentsRepo.delete({ 
        envelopeId: input.envelopeId, 
        consentId: input.consentId 
      });
    },

    /**
     * @summary Submits a consent
     * @description Submits a consent for approval or processing
     *
     * @param {SubmitConsentAppInput} input - The consent submission parameters
     * @returns {Promise<SubmitConsentAppResult>} Promise resolving to the submitted consent data
     */
    async submit(input: SubmitConsentAppInput): Promise<SubmitConsentAppResult> {
      // Implement idempotency if key is provided
      if (input.idempotencyKey) {
        return idempotencyRunner.run(
          input.idempotencyKey,
          async () => {
            const row = await consentsRepo.update(
              { envelopeId: input.envelopeId, consentId: input.consentId },
              { 
                status: "granted" as ConsentStatus,
                updatedAt: asISO(nowIso())
              }
            );

            return mapRowToSubmitResult(row);
          },
          input.ttlSeconds
        );
      }

      // Fallback to non-idempotent submission
      const row = await consentsRepo.update(
        { envelopeId: input.envelopeId, consentId: input.consentId },
        { 
          status: "granted" as ConsentStatus,
          updatedAt: asISO(nowIso())
        }
      );

      return mapRowToSubmitResult(row);
    },

    /**
     * @summary Delegates a consent to another party
     * @description Delegates a consent to another party for processing
     *
     * @param {DelegateConsentAppInput} input - The consent delegation parameters
     * @param {ActorContext} [actorContext] - Optional actor context for audit purposes
     * @returns {Promise<DelegateConsentAppResult>} Promise resolving to the delegated consent data
     */
    async delegate(input: DelegateConsentAppInput, actorContext?: ActorContext): Promise<DelegateConsentAppResult> {
      // Implement idempotency if key is provided
      if (input.idempotencyKey) {
        return idempotencyRunner.run(
          input.idempotencyKey,
          async () => {
            return performDelegation(input, actorContext);
          },
          input.ttlSeconds
        );
      }

      // Fallback to non-idempotent delegation
      return performDelegation(input, actorContext);
    },
  };
}
