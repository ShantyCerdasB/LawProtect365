/**
 * @file ConsentDelegationService.ts
 * @summary Service for handling consent delegation business logic
 * @description Manages the complete consent delegation flow including party creation,
 * delegation record creation, consent status updates, audit logging, and event publishing.
 * This service encapsulates all the business logic that was previously scattered in the adapter.
 */

import type { ConsentCommandRepo } from "../../../domain/types/consent/AdapterDependencies";
import type { DelegationRepositoryDdb } from "../../../infrastructure/dynamodb/DelegationRepositoryDdb";
import type { GlobalPartiesRepository } from "../../../domain/contracts/repositories/global-parties/GlobalPartiesRepository";
import type { ConsentValidationService } from "./ConsentValidationService";
import type { ConsentAuditService } from "./ConsentAuditService";
import type { ConsentEventService } from "./ConsentEventService";
import type { 
  DelegateConsentAppInput, 
  DelegateConsentAppResult 
} from "../../../domain/types/consent/AppServiceInputs";
import type { PartyId, TenantId } from "@/domain/value-objects/ids";
import type { ConsentStatus } from "../../../domain/values/enums";
import type { ActorContext } from "@lawprotect/shared-ts";
import { nowIso, asISO, asISOOpt } from "@lawprotect/shared-ts";
import { NotFoundError } from "../../../shared/errors";
import { findOrCreatePartyForDelegation } from "./ConsentPartyHelpers";
import { createConsentAuditContext } from "../../adapters/consent/ConsentHelpers";

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
    const delegatePartyId = await findOrCreatePartyForDelegation(
      this.globalPartiesRepo,
      this.ids,
      {
        tenantId: input.tenantId,
        email: input.delegateEmail,
        name: input.delegateName
      }
    );

    // 4. Create delegation record
    const delegation = await this.delegationsRepo.create({
      delegationId: this.ids.ulid(),
      tenantId: input.tenantId,
      consentId: input.consentId,
      envelopeId: input.envelopeId,
      originalPartyId: currentConsent.partyId as PartyId,
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
      const auditContext = createConsentAuditContext(
        input.tenantId as TenantId,
        input.envelopeId,
        actorContext
      );
      
      await this.auditService.logConsentDelegation(auditContext as any, {
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
    if (this.eventService) {
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

}






