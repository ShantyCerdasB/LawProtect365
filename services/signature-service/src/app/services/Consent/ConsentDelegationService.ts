/**
 * @file ConsentDelegationService.ts
 * @summary Service for handling consent delegation business logic
 * @description Manages the complete consent delegation flow including party creation,
 * delegation record creation, consent status updates, audit logging, and event publishing.
 * This service encapsulates all the business logic that was previously scattered in the adapter.
 */

import type { ConsentCommandRepo } from "../../../shared/types/consent/AdapterDependencies";
import type { DelegationRepositoryDdb } from "../../../infrastructure/dynamodb/DelegationRepositoryDdb";
import type { GlobalPartiesRepository } from "../../../shared/contracts/repositories/global-parties/GlobalPartiesRepository";
import type { ConsentValidationService } from "./ConsentValidationService";
import type { ConsentAuditService } from "./ConsentAuditService";
import type { ConsentEventService } from "./ConsentEventService";
import type { 
  DelegateConsentAppInput, 
  DelegateConsentAppResult 
} from "../../../shared/types/consent/AppServiceInputs";
import type { FindOrCreatePartyInput } from "../../../shared/types/global-parties";
import type {  PartyId } from "../../../domain/value-objects/Ids";
import type { ConsentStatus } from "../../../domain/values/enums";
import type { ActorContext } from "../../../domain/entities/ActorContext";
import type { UserId } from "@lawprotect/shared-ts";
import { nowIso, asISO, asISOOpt } from "@lawprotect/shared-ts";
import { NotFoundError, BadRequestError } from "../../../shared/errors";

/**
 * @summary Service for handling consent delegation business logic
 * @description Orchestrates the complete consent delegation process including validation,
 * party management, delegation creation, consent updates, audit logging, and event publishing.
 */
export class ConsentDelegationService {
  constructor(
    private readonly consentsRepo: ConsentCommandRepo,
    private readonly delegationsRepo: DelegationRepositoryDdb,
    private readonly globalPartiesRepo: GlobalPartiesRepository,
    private readonly ids: { ulid(): string },
    private readonly validationService?: ConsentValidationService,
    private readonly auditService?: ConsentAuditService,
    private readonly eventService?: ConsentEventService
  ) {}

  /**
   * @summary Delegates a consent to another party
   * @description Executes the complete consent delegation flow:
   * 1. Validation (if validation service available)
   * 2. Get current consent to obtain originalPartyId
   * 3. Find or create delegate party
   * 4. Create delegation record
   * 5. Update consent status to delegated
   * 6. Audit logging (if audit service available)
   * 7. Event publishing (if event service available)
   * 
   * @param input - The consent delegation parameters
   * @param actorContext - Optional actor context for audit purposes
   * @returns Promise resolving to the delegated consent data
   * 
   * @throws NotFoundError if consent not found
   * @throws BadRequestError if delegation validation fails
   */
  async delegateConsent(
    input: DelegateConsentAppInput, 
    actorContext?: ActorContext
  ): Promise<DelegateConsentAppResult> {
    // 1. VALIDATION (if validation service available)
    if (this.validationService) {
      await this.validationService.validateConsentDelegation({
        tenantId: input.tenantId,
        envelopeId: input.envelopeId,
        consentId: input.consentId,
        delegateEmail: input.delegateEmail,
        delegateName: input.delegateName
      });
    }

    // 2. Get current consent to obtain originalPartyId
    const currentConsent = await this.consentsRepo.getById({
      envelopeId: input.envelopeId,
      consentId: input.consentId
    });
    
    if (!currentConsent) {
      throw new NotFoundError('Consent not found', undefined, { consentId: input.consentId });
    }

    // 3. FIND OR CREATE DELEGATE PARTY
    const delegatePartyId = await this.findOrCreatePartyForDelegate({
      tenantId: input.tenantId,
      email: input.delegateEmail,
      name: input.delegateName
    });

    // 4. Create delegation record
    const delegation = await this.delegationsRepo.create({
      delegationId: this.ids.ulid(),
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
    await this.consentsRepo.update(
      { envelopeId: input.envelopeId, consentId: input.consentId },
      { 
        status: "delegated" as ConsentStatus,
        updatedAt: asISO(nowIso())
      }
    );

    // 6. AUDIT - Use actor context if available, fallback to system context
    if (this.auditService) {
      const auditContext = {
        tenantId: input.tenantId,
        envelopeId: input.envelopeId,
        actor: actorContext || { 
          userId: "system" as UserId, 
          email: "system@lawprotect.com" 
        }
      };
      
      await this.auditService.logConsentDelegation(auditContext, {
        consentId: input.consentId,
        originalPartyId: currentConsent.partyId,
        delegatePartyId: delegatePartyId,
        delegationId: delegation.delegationId,
        reason: input.reason,
        expiresAt: input.expiresAt,
        metadata: input.metadata,
      });
    }

    // 7. EVENTS
    if (this.eventService) {
      const consentDelegatedEvent = {
        type: "consent.delegated" as const,
        payload: {
          tenantId: input.tenantId,
          consentId: input.consentId,
          envelopeId: input.envelopeId,
          originalPartyId: currentConsent.partyId,
          delegatePartyId: delegatePartyId,
          delegationId: delegation.delegationId,
          reason: input.reason,
          expiresAt: input.expiresAt,
          metadata: input.metadata,
        }
      };
      
      await this.eventService.publishConsentDelegatedEvent(consentDelegatedEvent);
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
   * 
   * @param input - Contains tenantId, email, and name for party lookup/creation
   * @returns Promise resolving to the party ID (existing or newly created)
   * 
   * @throws BadRequestError if email or name are invalid
   */
  private async findOrCreatePartyForDelegate(
    input: FindOrCreatePartyInput
  ): Promise<PartyId> {
    // Validate input
    if (!input.email?.trim() || !input.name?.trim()) {
      throw new BadRequestError("Email and name are required for party delegation");
    }

    // First, try to find existing party by email
    const existingParty = await this.globalPartiesRepo.findByEmail({
      tenantId: input.tenantId,
      email: input.email
    });

    if (existingParty?.party) {
      return existingParty.party.partyId;
    }

    // If not found, create a new party for the delegate
    const newPartyId = this.ids.ulid() as PartyId;
    
    await this.globalPartiesRepo.create({
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

    return newPartyId;
  }
}
