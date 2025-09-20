/**
 * @fileoverview BaseEventService - Base abstract class for domain event publishing services
 * @summary Provides common event publishing functionality for all domain services
 * @description Base abstract class that provides common event publishing functionality
 * that can be extended by module-specific event services (EnvelopeEventService, 
 * SignerEventService, etc.). Uses the outbox pattern for reliable event delivery.
 */

import { randomBytes } from 'crypto';
import type { ActorContext, DomainEvent } from '../index.js';
import { makeEvent } from '../index.js';
import { OutboxRepository } from '../aws/outbox/OutboxRepository.js';

/**
 * Event service configuration
 * Configuration options for event services
 */
export interface EventServiceConfig {
  outboxRepository: OutboxRepository;
  serviceName: string;
  defaultTraceId?: string;
}

/**
 * Base abstract class for domain event publishing services
 * 
 * Provides common event publishing functionality that can be extended
 * by module-specific event services. Uses the outbox pattern for reliable
 * event delivery with proper error handling and observability.
 */
export abstract class BaseEventService {
  protected readonly outbox: OutboxRepository;
  protected readonly serviceName: string;
  protected readonly defaultTraceId?: string;

  constructor(config: EventServiceConfig) {
    this.outbox = config.outboxRepository;
    this.serviceName = config.serviceName;
    this.defaultTraceId = config.defaultTraceId;
  }

  /**
   * Publishes a domain event using the outbox pattern
   * @param event - Domain event to publish
   * @param traceId - Optional trace ID for observability
   */
  async publishDomainEvent(
    event: DomainEvent, 
    traceId?: string
  ): Promise<void> {
    const finalTraceId = traceId || this.defaultTraceId;
    
    await this.outbox.save({
      id: event.id,
      type: event.type,
      payload: event.payload as Record<string, unknown>,
      occurredAt: event.occurredAt
    }, finalTraceId);
  }

  /**
   * Creates a domain event with standardized actor and metadata
   * @param eventType - Type of the domain event
   * @param payload - Event-specific payload data
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   * @returns Domain event ready for publishing
   */
  protected createDomainEvent(
    eventType: string,
    payload: Record<string, unknown>,
    actor: ActorContext,
    traceId?: string
  ): DomainEvent {
    const finalTraceId = traceId || this.defaultTraceId;
    
    return makeEvent(
      eventType,
      {
        ...payload,
        actor: this.createEventActor(actor),
        occurredAt: new Date().toISOString()
      },
      this.createTraceHeaders(finalTraceId)
    );
  }

  /**
   * Publishes a domain event with standardized actor and metadata
   * @param eventType - Type of the domain event
   * @param payload - Event-specific payload data
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  protected async publishStandardizedEvent(
    eventType: string,
    payload: Record<string, unknown>,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    const domainEvent = this.createDomainEvent(eventType, payload, actor, traceId);
    await this.publishDomainEvent(domainEvent, traceId);
  }

  /**
   * Creates a standardized actor object from ActorContext
   * @param actor - Actor context containing user information
   * @returns Standardized actor object for events
   */
  private createEventActor(actor: ActorContext) {
    return {
      userId: actor.userId,
      email: actor.email,
      ip: actor.ip,
      userAgent: actor.userAgent,
      role: actor.role
    };
  }

  /**
   * Creates trace headers for domain events
   * @param traceId - Optional trace ID for observability
   * @returns Headers object with trace ID or undefined
   */
  private createTraceHeaders(traceId?: string) {
    return traceId ? { "x-trace-id": traceId } : undefined;
  }

  /**
   * Publishes a simple event (for backward compatibility)
   * @param eventType - The event type
   * @param payload - The event payload
   * @param traceId - Optional trace ID for observability
   */
  async publishEvent(eventType: string, payload: Record<string, unknown>, traceId?: string): Promise<void> {
    const domainEvent: DomainEvent = {
      id: `${eventType}-${Date.now()}-${randomBytes(6).toString('hex')}`,
      type: eventType,
      payload: payload as unknown,
      occurredAt: new Date().toISOString()
    };

    await this.publishDomainEvent(domainEvent, traceId);
  }

  /**
   * Publishes a module-specific domain event
   * Abstract method that each module must implement for its specific events
   * @param event - Module-specific domain event
   * @param traceId - Optional trace ID for observability
   */
  abstract publishModuleEvent(
    event: DomainEvent, 
    traceId?: string
  ): Promise<void>;

  /**
   * Gets the service name for logging and observability
   * @returns Service name
   */
  getServiceName(): string {
    return this.serviceName;
  }
}
