/**
 * @file SigningEventService.ts
 * @summary Event service for Signing domain events
 * @description Handles publishing of Signing-related domain events using the outbox pattern.
 * Extends BaseEventService to provide Signing-specific event publishing functionality.
 */

import { BaseEventService } from "../../../shared/services/BaseEventService";
import type { DomainEvent } from "@lawprotect/shared-ts";
import type { EnvelopeId, PartyId, TenantId } from "../../../domain/value-objects/Ids";
import type { ActorContext } from "../../../domain/entities/ActorContext";
import type { SigningEventService } from "../../../shared/types/signing";

/**
 * @summary Event service for Signing domain events
 * @description Extends BaseEventService to provide Signing-specific event publishing functionality.
 * Uses the outbox pattern for reliable event delivery.
 */
export class DefaultSigningEventService extends BaseEventService implements SigningEventService {
  /**
   * @summary Publishes a signing completed domain event
   * @description Publishes a signing completion event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishSigningCompleted(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.completed",
      { envelopeId, partyId, tenantId },
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a signing declined domain event
   * @description Publishes a signing decline event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishSigningDeclined(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.declined",
      { envelopeId, partyId, tenantId },
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes an OTP requested domain event
   * @description Publishes an OTP request event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishOtpRequested(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "otp.requested",
      { envelopeId, partyId, tenantId },
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes an OTP verified domain event
   * @description Publishes an OTP verification event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishOtpVerified(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "otp.verified",
      { envelopeId, partyId, tenantId },
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a presign upload domain event
   * @description Publishes a presign upload event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishPresignUpload(
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.presign_upload",
      { envelopeId, tenantId },
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a download signed document domain event
   * @description Publishes a download signed document event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishDownloadSignedDocument(
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.download_signed_document",
      { envelopeId, tenantId },
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a signing prepared domain event
   * @description Publishes a signing preparation event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishSigningPrepared(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.prepared",
      { envelopeId, partyId, tenantId },
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a signing consent recorded domain event
   * @description Publishes a signing consent recorded event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishSigningConsentRecorded(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.consent_recorded",
      { envelopeId, partyId, tenantId },
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a module-specific domain event
   * @description Implementation of the abstract method from BaseEventService
   * @param event - Module-specific domain event
   * @param traceId - Optional trace ID for observability
   */
  async publishModuleEvent(
    event: DomainEvent,
    traceId?: string
  ): Promise<void> {
    await this.publishDomainEvent(event, traceId);
  }
}
