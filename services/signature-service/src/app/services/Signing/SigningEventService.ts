/**
 * @file SigningEventService.ts
 * @summary Event service for Signing domain events
 * @description Handles publishing of Signing-related domain events using the outbox pattern.
 * Extends BaseEventService to provide Signing-specific event publishing functionality.
 */

import { BaseEventService } from "../../../domain/services/BaseEventService";
import type { DomainEvent, ActorContext } from "@lawprotect/shared-ts";
import type { EnvelopeId, PartyId } from "@/domain/value-objects/ids";
import type { SigningEventService as ISigningEventService } from "../../../domain/types/signing";

/**
 * @summary Event service for Signing domain events
 * @description Extends BaseEventService to provide Signing-specific event publishing functionality.
 * Uses the outbox pattern for reliable event delivery.
 */
export class SigningEventService extends BaseEventService implements ISigningEventService {
  /**
   * @summary Publishes a signing completed domain event
   * @description Publishes a signing completion event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishSigningCompleted(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.completed",
      { envelopeId, partyId},
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a signing declined domain event
   * @description Publishes a signing decline event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishSigningDeclined(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.declined",
      { envelopeId, partyId},
      actor,
      traceId
    );
  }


  /**
   * @summary Publishes a presign upload domain event
   * @description Publishes a presign upload event using the outbox pattern
   * @param envelopeId - Envelope identifier   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishPresignUpload(
    envelopeId: EnvelopeId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.presign_upload",
      { envelopeId},
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a download signed document domain event
   * @description Publishes a download signed document event using the outbox pattern
   * @param envelopeId - Envelope identifier   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishDownloadSignedDocument(
    envelopeId: EnvelopeId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.download_signed_document",
      { envelopeId},
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a signing prepared domain event
   * @description Publishes a signing preparation event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishSigningPrepared(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.prepared",
      { envelopeId, partyId},
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a signing consent recorded domain event
   * @description Publishes a signing consent recorded event using the outbox pattern
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishSigningConsentRecorded(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "signing.consent_recorded",
      { envelopeId, partyId },
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
};
