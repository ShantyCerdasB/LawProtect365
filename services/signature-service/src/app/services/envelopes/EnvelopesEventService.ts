/**
 * @file EnvelopesEventService.ts
 * @summary Event service for envelope operations
 * @description Publishes domain events for envelope lifecycle changes
 */

import { BaseEventService } from "../../../domain/services/BaseEventService";
import type { EnvelopeId, TenantId, UserId } from "@/domain/value-objects/ids";
import type { EnvelopeStatus } from "@/domain/value-objects/index";
import type { Envelope } from "../../../domain/entities/Envelope";
import { makeEvent, type DomainEvent } from "@lawprotect/shared-ts";

/**
 * @summary Event service for envelope operations
 * @description Extends BaseEventService to provide envelope-specific event publishing
 */
export class EnvelopesEventService extends BaseEventService {
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

  /**
   * @summary Publishes envelope created event
   * @param context - Event context
   * @param details - Envelope creation details
   */
  async publishEnvelopeCreatedEvent(context: { tenantId: TenantId; actor: { userId: UserId; email: string } }, details: { envelope: Envelope }): Promise<void> {
    const event: DomainEvent = makeEvent("envelope.created", {
      envelopeId: details.envelope.envelopeId,
      tenantId: details.envelope.tenantId,
      ownerId: details.envelope.ownerId,
      title: details.envelope.title,
      status: details.envelope.status,
      createdAt: details.envelope.createdAt,
      actor: context.actor
    });

    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publishes envelope updated event
   * @param context - Event context
   * @param details - Envelope update details
   */
  async publishEnvelopeUpdatedEvent(context: { tenantId: TenantId; actor: { userId: UserId; email: string } }, details: { envelope: Envelope; previousStatus?: EnvelopeStatus; changes: Partial<Envelope> }): Promise<void> {
    const event: DomainEvent = makeEvent("envelope.updated", {
      envelopeId: details.envelope.envelopeId,
      tenantId: details.envelope.tenantId,
      previousStatus: details.previousStatus,
      currentStatus: details.envelope.status,
      changes: details.changes,
      updatedAt: details.envelope.updatedAt,
      actor: context.actor
    });

    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publishes envelope deleted event
   * @param context - Event context
   * @param details - Envelope deletion details
   */
  async publishEnvelopeDeletedEvent(context: { tenantId: TenantId; actor: { userId: UserId; email: string } }, details: { envelopeId: EnvelopeId; title: string; status: EnvelopeStatus; tenantId: TenantId }): Promise<void> {
    const event: DomainEvent = makeEvent("envelope.deleted", {
      envelopeId: details.envelopeId,
      tenantId: details.tenantId,
      title: details.title,
      status: details.status,
      deletedAt: new Date().toISOString(),
      actor: context.actor
    });

    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publishes envelope status changed event
   * @param context - Event context
   * @param details - Status change details
   */
  async publishEnvelopeStatusChangedEvent(context: { tenantId: TenantId; actor: { userId: UserId; email: string } }, details: { envelopeId: EnvelopeId; previousStatus: EnvelopeStatus; newStatus: EnvelopeStatus; reason?: string }): Promise<void> {
    const event: DomainEvent = makeEvent("envelope.status_changed", {
      envelopeId: details.envelopeId,
      tenantId: context.tenantId,
      previousStatus: details.previousStatus,
      newStatus: details.newStatus,
      reason: details.reason,
      changedAt: new Date().toISOString(),
      actor: context.actor
    });

    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publishes envelope party added event
   * @param context - Event context
   * @param details - Party addition details
   */
  async publishEnvelopePartyAddedEvent(context: { tenantId: TenantId; actor: { userId: UserId; email: string } }, details: { envelopeId: EnvelopeId; partyId: string; role: string }): Promise<void> {
    const event: DomainEvent = makeEvent("envelope.party_added", {
      envelopeId: details.envelopeId,
      tenantId: context.tenantId,
      partyId: details.partyId,
      role: details.role,
      addedAt: new Date().toISOString(),
      actor: context.actor
    });

    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publishes envelope document added event
   * @param context - Event context
   * @param details - Document addition details
   */
  async publishEnvelopeDocumentAddedEvent(context: { tenantId: TenantId; actor: { userId: UserId; email: string } }, details: { envelopeId: EnvelopeId; documentId: string; documentName: string }): Promise<void> {
    const event: DomainEvent = makeEvent("envelope.document_added", {
      envelopeId: details.envelopeId,
      tenantId: context.tenantId,
      documentId: details.documentId,
      documentName: details.documentName,
      addedAt: new Date().toISOString(),
      actor: context.actor
    });

    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publishes envelope accessed event
   * @param context - Event context
   * @param details - Envelope access details
   */
  async publishEnvelopeAccessed(context: { tenantId: TenantId; envelopeId?: string; actor?: { userId?: UserId; email?: string } }, details: { envelopeId: EnvelopeId }): Promise<void> {
    const event: DomainEvent = makeEvent("envelope.accessed", {
      envelopeId: details.envelopeId,
      tenantId: context.tenantId,
      operation: "getById",
      accessedAt: new Date().toISOString(),
      actor: context.actor
    });

    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publishes envelope list accessed event
   * @param context - Event context
   * @param details - Envelope list access details
   */
  async publishEnvelopeListAccessed(context: { tenantId: TenantId; actor?: { userId?: UserId; email?: string } }, details: { limit?: number; cursor?: string; resultCount: number }): Promise<void> {
    const event: DomainEvent = makeEvent("envelope.list_accessed", {
      tenantId: context.tenantId,
      operation: "list",
      limit: details.limit,
      cursor: details.cursor,
      resultCount: details.resultCount,
      accessedAt: new Date().toISOString(),
      actor: context.actor
    });

    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publishes envelope status accessed event
   * @param context - Event context
   * @param details - Envelope status access details
   */
  async publishEnvelopeStatusAccessed(context: { tenantId: TenantId; envelopeId?: string; actor?: { userId?: UserId; email?: string } }, details: { envelopeId: EnvelopeId; status: EnvelopeStatus }): Promise<void> {
    const event: DomainEvent = makeEvent("envelope.status_accessed", {
      envelopeId: details.envelopeId,
      tenantId: context.tenantId,
      status: details.status,
      operation: "getStatus",
      accessedAt: new Date().toISOString(),
      actor: context.actor
    });

    await this.publishModuleEvent(event);
  }
}






