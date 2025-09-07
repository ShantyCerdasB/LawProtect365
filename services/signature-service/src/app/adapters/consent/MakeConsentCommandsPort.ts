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
} from "../../../shared/types/consent/ConsentTypes";
import type { ConsentCommandRepo, Ids } from "../../../shared/types/consent/AdapterDependencies";
import type { ConsentId, EnvelopeId, PartyId } from "../../../domain/value-objects/Ids";
import type { ConsentStatus, ConsentType } from "../../../domain/values/enums";
import { nowIso, asISO, asISOOpt } from "@lawprotect/shared-ts";
import type { DelegationRepositoryDdb } from "../../../infrastructure/dynamodb/DelegationRepositoryDdb";
import type { ConsentValidationService } from "../../services/Consent/ConsentValidationService";
import type { ConsentAuditService } from "../../services/Consent/ConsentAuditService";
import type { ConsentEventService } from "../../services/Consent/ConsentEventService";

import type { ActorContext } from "../../../domain/entities/ActorContext";
import { createConsentWithAudit, logConsentDeletionAudit, updateConsentWithAudit } from "./ConsentHelpers";
import type { IdempotencyRunner } from "../../../infrastructure/idempotency/IdempotencyRunner";
import type { GlobalPartiesRepository } from "../../../shared/contracts/repositories/global-parties/GlobalPartiesRepository";
import type { FindOrCreatePartyInput } from "../../../shared/types/global-parties";
import { NotFoundError, BadRequestError } from "../../../shared/errors";


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
  status: r.status,
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
interface ConsentCommandsPortConfig {
  consentsRepo: ConsentCommandRepo;
  delegationsRepo: DelegationRepositoryDdb;
  ids: Ids;
  globalPartiesRepo: GlobalPartiesRepository;
  validationService: ConsentValidationService;
  auditService: ConsentAuditService;
  eventService: ConsentEventService;
  idempotencyRunner: IdempotencyRunner;
}

export function makeConsentCommandsPort(
  config: ConsentCommandsPortConfig
): ConsentCommandsPort {
  const {
    consentsRepo,
    delegationsRepo,
    ids,
    globalPartiesRepo,
    validationService,
    auditService,
    eventService,
    idempotencyRunner
  } = config;
  
  /**
   * @summary Performs the actual consent delegation logic
   * @description Internal function that handles the delegation process
   */
  async function performDelegation(input: DelegateConsentAppInput, actorContext?: ActorContext): Promise<DelegateConsentAppResult> {
    // 1. VALIDATION (if validation service available)
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

    // 3. FIND OR CREATE DELEGATE PARTY
    const delegatePartyId = await findOrCreatePartyForDelegate({
      tenantId: input.tenantId,
      email: input.delegateEmail,
      name: input.delegateName
    });

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
    if (auditService && actorContext) {
      const auditContext = {
        tenantId: input.tenantId,
        envelopeId: input.envelopeId,
        actor: actorContext
      };
      
      await auditService.logConsentDelegation(auditContext, {
        consentId: input.consentId,
        originalPartyId: currentConsent.partyId as PartyId,
        delegatePartyId: delegatePartyId,
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
          delegatePartyId: delegatePartyId,
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

  /**
   * @summary Finds an existing party by email or creates a new one for delegation
   * @description Searches for a party with the given email in the tenant. If not found,
   * creates a new party record for the delegate.
   */
  async function findOrCreatePartyForDelegate(
    input: FindOrCreatePartyInput
  ): Promise<PartyId> {
    // Validate input
    if (!input.email?.trim() || !input.name?.trim()) {
      throw new BadRequestError("Email and name are required for party delegation");
    }

    // First, try to find existing party by email
    const existingParty = await globalPartiesRepo.findByEmail({
      tenantId: input.tenantId,
      email: input.email
    });

    if (existingParty?.party) {
      return existingParty.party.partyId
    }

    // If not found, create a new party for the delegate
    const newPartyId = ids.ulid() as PartyId;
    
    await globalPartiesRepo.create({
      partyId: newPartyId,
      tenantId: input.tenantId,
      email: input.email,
      name: input.name,
      role: "signer" as any, // Default role for delegates
      source: "manual" as any, // Default source
      status: "active" as any, // Default status
      preferences: {
        defaultAuth: "otpViaEmail" as any,
        defaultLocale: undefined,
      },
      notificationPreferences: {
        email: true,
        sms: false,
      },
      stats: {
        signedCount: 0,
        totalEnvelopes: 0,
      },
      metadata: {
        createdFor: "consent-delegation",
        originalEmail: input.email,
        originalName: input.name
      }
    });

    return newPartyId
  }

  return {
    /**
     * @summary Creates a new consent
     * @description Creates a new consent record with generated ID and initial pending status.
     * Validates enum values and brands ISO date strings for type safety.
     *
     * @param {CreateConsentAppInput} input - Consent creation parameters
     * @param {ActorContext} [actorContext] - Optional actor context for audit purposes
     * @returns {Promise<CreateConsentAppResult>} Promise resolving to the created consent data
     */
    async create(input: CreateConsentAppInput, actorContext?: ActorContext): Promise<CreateConsentAppResult> {
      // Implement idempotency if key is provided
      if (input.idempotencyKey) {
        return idempotencyRunner.run(
          input.idempotencyKey,
          async () => {
            return await createConsentWithAudit(
              consentsRepo,
              auditService,
              ids,
              input,
              actorContext
            );
          },
          input.ttlSeconds
        );
      }

      // Fallback to non-idempotent creation
      return await createConsentWithAudit(
        consentsRepo,
        auditService,
        ids,
        input,
        actorContext
      );
    },

    /**
     * @summary Updates an existing consent
     * @description Updates a consent record with the provided changes.
     * Validates status enum if provided and brands ISO date strings.
     *
     * @param {UpdateConsentAppInput} input - The consent update parameters
     * @param {ActorContext} [actorContext] - Optional actor context for audit purposes
     * @returns {Promise<UpdateConsentAppResult>} Promise resolving to the updated consent data
     */
    async update(input: UpdateConsentAppInput, actorContext?: ActorContext): Promise<UpdateConsentAppResult> {
      // Implement idempotency if key is provided
      if (input.idempotencyKey) {
        return idempotencyRunner.run(
          input.idempotencyKey,
          async () => {
            return await updateConsentWithAudit(
              consentsRepo,
              auditService,
              input,
              actorContext
            );
          },
          input.ttlSeconds
        );
      }

      // Fallback to non-idempotent update
      return await updateConsentWithAudit(
        consentsRepo,
        auditService,
        input,
        actorContext
      );
    },

    /**
     * @summary Deletes a consent
     * @description Deletes a consent record from the repository
     *
     * @param {DeleteConsentAppInput} input - The consent deletion parameters
     * @param {ActorContext} [actorContext] - Optional actor context for audit purposes
     * @returns {Promise<void>} Promise resolving when deletion is complete
     */
    async delete(input: DeleteConsentAppInput, actorContext?: ActorContext): Promise<void> {
      // Get consent details before deletion for audit
      let consentDetails: ConsentRepoRow | null = null;
      if (auditService && actorContext) {
        try {
          // Use the existing getById method from the repository
          consentDetails = await consentsRepo.getById({
            envelopeId: input.envelopeId,
            consentId: input.consentId,
          });
        } catch (error) {
          // If consent not found, proceed with deletion anyway
          console.warn('Consent not found during deletion:', error);
        }
      }

      // Implement idempotency if key is provided
      if (input.idempotencyKey) {
        return idempotencyRunner.run(
          input.idempotencyKey,
          async () => {
            await consentsRepo.delete({ 
              envelopeId: input.envelopeId, 
              consentId: input.consentId 
            });

            // ✅ AUDIT: Log consent deletion if audit service available
            if (consentDetails) {
              await logConsentDeletionAudit(
                auditService,
                input,
                consentDetails,
                actorContext
              );
            }
          },
          input.ttlSeconds
        );
      }

      // Fallback to non-idempotent delete
      await consentsRepo.delete({ 
        envelopeId: input.envelopeId, 
        consentId: input.consentId 
      });

      // ✅ AUDIT: Log consent deletion if audit service available
      if (consentDetails) {
        await logConsentDeletionAudit(
          auditService,
          input,
          consentDetails,
          actorContext
        );
      }
    },

    /**
     * @summary Submits a consent
     * @description Submits a consent for approval or processing
     *
     * @param {SubmitConsentAppInput} input - The consent submission parameters
     * @param {ActorContext} [actorContext] - Optional actor context for audit purposes
     * @returns {Promise<SubmitConsentAppResult>} Promise resolving to the submitted consent data
     */
    async submit(input: SubmitConsentAppInput, actorContext?: ActorContext): Promise<SubmitConsentAppResult> {
      // Get consent details before submission for audit
      let previousConsent: ConsentRepoRow | null = null;
      if (auditService && actorContext) {
        try {
          previousConsent = await consentsRepo.getById({
            envelopeId: input.envelopeId,
            consentId: input.consentId,
          });
        } catch (error) {
          // If consent not found, proceed with submission anyway
          console.warn('Consent not found during submission:', error);
        }
      }

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

            const result = mapRowToSubmitResult(row);

            // ✅ AUDIT: Log consent submission if audit service available
            if (auditService && actorContext && previousConsent) {
              await auditService.logConsentUpdate({
                tenantId: previousConsent.tenantId as any, // Cast to avoid branded type issues
                envelopeId: input.envelopeId,
                actor: actorContext,
              }, {
                consentId: input.consentId,
                previousStatus: previousConsent.status,
                newStatus: "granted",
                reason: "consent_submitted",
                metadata: {
                  previousStatus: previousConsent.status,
                  previousMetadata: previousConsent.metadata,
                  previousExpiresAt: previousConsent.expiresAt,
                  submittedAt: result.submittedAt,
                },
              });
            }

            return result;
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

      const result = mapRowToSubmitResult(row);

      // ✅ AUDIT: Log consent submission if audit service available
      if (auditService && actorContext && previousConsent) {
        await auditService.logConsentUpdate({
          tenantId: previousConsent.tenantId as any, // Cast to avoid branded type issues
          envelopeId: input.envelopeId,
          actor: actorContext,
        }, {
          consentId: input.consentId,
          previousStatus: previousConsent.status,
          newStatus: "granted",
          reason: "consent_submitted",
          metadata: {
            previousStatus: previousConsent.status,
            previousMetadata: previousConsent.metadata,
            previousExpiresAt: previousConsent.expiresAt,
            submittedAt: result.submittedAt,
          },
        });
      }

      return result;
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
