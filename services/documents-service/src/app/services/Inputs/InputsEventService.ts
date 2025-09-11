/**
 * @file InputsEventService.ts
 * @summary Event service for Input operations
 * @description Handles event publishing for input create, update, and delete operations
 */

import { BaseEventService } from "../../../domain/services/BaseEventService";
import type { ActorContext, DomainEvent } from "@lawprotect/shared-ts";

/**
 * @summary Event service for Input operations
 * @description Extends BaseEventService to provide input-specific event publishing
 */
export class InputsEventService extends BaseEventService {
  /**
   * @summary Publishes a module-specific domain event
   * @description Implements the abstract method from BaseEventService
   */
  async publishModuleEvent(
    event: DomainEvent, 
    traceId?: string
  ): Promise<void> {
    await this.publishDomainEvent(event, traceId);
  }

  /**
   * @summary Publishes input created event
   * @description Publishes event when inputs are created
   */
  async publishInputsCreatedEvent(
    inputIds: string[],
    envelopeId: string,
    documentId: string,
    actor: ActorContext
  ): Promise<void> {
    const event: DomainEvent = {
      id: `input-created-${Date.now()}`,
      type: "InputsCreated",
      payload: {
        inputIds,
        envelopeId,
        documentId,
        actor: actor.email},
      occurredAt: new Date().toISOString()
    };

    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publishes input updated event
   * @description Publishes event when an input is updated
   */
  async publishInputUpdatedEvent(
    inputId: string,
    envelopeId: string,
    updatedFields: string[],
    actor: ActorContext
  ): Promise<void> {
    const event: DomainEvent = {
      id: `input-updated-${Date.now()}`,
      type: "InputUpdated",
      payload: {
        inputId,
        envelopeId,
        updatedFields,
        actor: actor.email},
      occurredAt: new Date().toISOString()
    };

    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publishes input positions updated event
   * @description Publishes event when input positions are updated
   */
  async publishInputPositionsUpdatedEvent(
    inputIds: string[],
    envelopeId: string,
    actor: ActorContext
  ): Promise<void> {
    const event: DomainEvent = {
      id: `input-positions-updated-${Date.now()}`,
      type: "InputPositionsUpdated",
      payload: {
        inputIds,
        envelopeId,
        actor: actor.email},
      occurredAt: new Date().toISOString()
    };

    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publishes input deleted event
   * @description Publishes event when an input is deleted
   */
  async publishInputDeletedEvent(
    inputId: string,
    envelopeId: string,
    actor: ActorContext
  ): Promise<void> {
    const event: DomainEvent = {
      id: `input-deleted-${Date.now()}`,
      type: "InputDeleted",
      payload: {
        inputId,
        envelopeId,
        actor: actor.email},
      occurredAt: new Date().toISOString()
    };

    await this.publishModuleEvent(event);
  }
};
