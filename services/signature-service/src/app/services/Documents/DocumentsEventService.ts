/**
 * @file DocumentsEventService.ts
 * @summary Event service for Documents domain events
 * @description Handles publishing of Documents-related domain events using the outbox pattern.
 * Extends BaseEventService to provide Documents-specific event publishing functionality.
 */

import { BaseEventService } from "../../../shared/services/BaseEventService";
import type { DomainEvent } from "@lawprotect/shared-ts";
import { makeEvent } from "@lawprotect/shared-ts";
import type { DocumentId, EnvelopeId, TenantId } from "../../../domain/value-objects/Ids";
import type { ActorContext } from "../../../domain/entities/ActorContext";

/**
 * @description Service interface for Documents event operations
 */
export interface DocumentsEventService {
  /**
   * Publishes a document created domain event
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  publishDocumentCreated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void>;

  /**
   * Publishes a document uploaded domain event
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  publishDocumentUploaded(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void>;

  /**
   * Publishes a document updated domain event
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  publishDocumentUpdated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void>;

  /**
   * Publishes a document deleted domain event
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  publishDocumentDeleted(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void>;

  /**
   * Publishes a document lock created domain event
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param lockId - Lock identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  publishDocumentLockCreated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    lockId: string,
    actor: ActorContext,
    traceId?: string
  ): Promise<void>;
}

/**
 * @summary Event service for Documents domain events
 * @description Extends BaseEventService to provide Documents-specific event publishing functionality.
 * Uses the outbox pattern for reliable event delivery.
 */
export class DefaultDocumentsEventService extends BaseEventService implements DocumentsEventService {
  /**
   * @summary Publishes a document created domain event
   * @description Publishes a document creation event using the outbox pattern
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishDocumentCreated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    const domainEvent: DomainEvent = makeEvent(
      "document.created",
      {
        documentId,
        envelopeId,
        tenantId,
        actor: {
          userId: actor.userId,
          email: actor.email,
          ip: actor.ip,
          userAgent: actor.userAgent,
          role: actor.role,
        },
        occurredAt: new Date().toISOString(),
      },
      traceId ? { "x-trace-id": traceId } : undefined
    );
    
    await this.publishDomainEvent(domainEvent, traceId);
  }

  /**
   * @summary Publishes a document uploaded domain event
   * @description Publishes a document upload event using the outbox pattern
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishDocumentUploaded(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    const domainEvent: DomainEvent = makeEvent(
      "document.uploaded",
      {
        documentId,
        envelopeId,
        tenantId,
        actor: {
          userId: actor.userId,
          email: actor.email,
          ip: actor.ip,
          userAgent: actor.userAgent,
          role: actor.role,
        },
        occurredAt: new Date().toISOString(),
      },
      traceId ? { "x-trace-id": traceId } : undefined
    );
    
    await this.publishDomainEvent(domainEvent, traceId);
  }

  /**
   * @summary Publishes a document updated domain event
   * @description Publishes a document update event using the outbox pattern
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishDocumentUpdated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    const domainEvent: DomainEvent = makeEvent(
      "document.updated",
      {
        documentId,
        envelopeId,
        tenantId,
        actor: {
          userId: actor.userId,
          email: actor.email,
          ip: actor.ip,
          userAgent: actor.userAgent,
          role: actor.role,
        },
        occurredAt: new Date().toISOString(),
      },
      traceId ? { "x-trace-id": traceId } : undefined
    );
    
    await this.publishDomainEvent(domainEvent, traceId);
  }

  /**
   * @summary Publishes a document deleted domain event
   * @description Publishes a document deletion event using the outbox pattern
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishDocumentDeleted(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    const domainEvent: DomainEvent = makeEvent(
      "document.deleted",
      {
        documentId,
        envelopeId,
        tenantId,
        actor: {
          userId: actor.userId,
          email: actor.email,
          ip: actor.ip,
          userAgent: actor.userAgent,
          role: actor.role,
        },
        occurredAt: new Date().toISOString(),
      },
      traceId ? { "x-trace-id": traceId } : undefined
    );
    
    await this.publishDomainEvent(domainEvent, traceId);
  }

  /**
   * @summary Publishes a document lock created domain event
   * @description Publishes a document lock creation event using the outbox pattern
   * @param documentId - Document identifier
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param lockId - Lock identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishDocumentLockCreated(
    documentId: DocumentId,
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    lockId: string,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    const domainEvent: DomainEvent = makeEvent(
      "document.lock.created",
      {
        documentId,
        envelopeId,
        tenantId,
        lockId,
        actor: {
          userId: actor.userId,
          email: actor.email,
          ip: actor.ip,
          userAgent: actor.userAgent,
          role: actor.role,
        },
        occurredAt: new Date().toISOString(),
      },
      traceId ? { "x-trace-id": traceId } : undefined
    );
    
    await this.publishDomainEvent(domainEvent, traceId);
  }

  /**
   * @summary Publishes a module-specific domain event
   * @description Implementation of the abstract method from BaseEventService
   * @param event - Domain event to publish
   * @param traceId - Optional trace ID for observability
   */
  async publishModuleEvent(
    event: DomainEvent,
    traceId?: string
  ): Promise<void> {
    await this.publishDomainEvent(event, traceId);
  }
}
