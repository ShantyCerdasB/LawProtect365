/**
 * @fileoverview SignatureAuditEventService - Business logic service for audit event operations
 * @summary Provides business logic for signature audit event management
 * @description This service handles all business logic for signature audit events,
 * including creation, retrieval, and audit trail management using the new Prisma-based architecture.
 */

import { SignatureAuditEvent } from '../domain/entities/SignatureAuditEvent';
import { SignatureAuditEventId } from '../domain/value-objects/SignatureAuditEventId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerId } from '../domain/value-objects/SignerId';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { SignatureAuditEventRepository } from '../repositories/SignatureAuditEventRepository';
import { CreateAuditEventRequest } from '../domain/types/audit/CreateAuditEventRequest';
import { AuditEventValidationRule } from '../domain/rules/AuditEventValidationRule';
import { 
  auditEventNotFound,
  auditEventCreationFailed
} from '../signature-errors';

/**
 * SignatureAuditEventService implementation
 * 
 * Provides business logic for signature audit event operations including creation,
 * retrieval, and audit trail management. Uses the new Prisma-based SignatureAuditEventRepository.
 */
export class SignatureAuditEventService {
  private static readonly MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
  private static readonly HOURS_IN_DAY = 24;
  private static readonly FIRST_ELEMENT_INDEX = 0;
  
  constructor(
    private readonly signatureAuditEventRepository: SignatureAuditEventRepository
  ) {}

  /**
   * Creates audit event with common fields for signer operations
   * @param config - Audit event configuration
   */
  async createSignerAuditEvent(config: {
    envelopeId: string;
    signerId: string;
    eventType: AuditEventType;
    description: string;
    userId: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SignatureAuditEvent> {
    return this.createEvent({
      envelopeId: config.envelopeId,
      signerId: config.signerId,
      eventType: config.eventType,
      description: config.description,
      userId: config.userId,
      userEmail: config.userEmail,
      ipAddress: config.ipAddress,
      userAgent: config.userAgent,
      country: config.country,
      metadata: config.metadata || {}
    });
  }

  /**
   * Creates a new signature audit event
   * @param request - The create audit event request
   * @returns The created signature audit event
   */
  async createEvent(request: CreateAuditEventRequest): Promise<SignatureAuditEvent> {
    try {
      // Validate creation parameters using domain rule
      AuditEventValidationRule.validateCreationParams({
        envelopeId: request.envelopeId,
        signerId: request.signerId,
        eventType: request.eventType,
        description: request.description,
        userId: request.userId,
        userEmail: request.userEmail
      });

      // Create the audit event entity
      const auditEvent = SignatureAuditEvent.create({
        envelopeId: EnvelopeId.fromString(request.envelopeId),
        signerId: request.signerId ? SignerId.fromString(request.signerId) : undefined,
        eventType: request.eventType,
        description: request.description,
        userId: request.userId,
        userEmail: request.userEmail,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        country: request.country,
        metadata: request.metadata
      });

      // Save to repository
      const createdEvent = await this.signatureAuditEventRepository.create(auditEvent);

      return createdEvent;
    } catch (error) {
      throw auditEventCreationFailed(
        `Failed to create audit event: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets a signature audit event by ID
   * @param auditEventId - The audit event ID
   * @returns The signature audit event
   */
  async getAuditEvent(auditEventId: SignatureAuditEventId): Promise<SignatureAuditEvent> {
    const auditEvent = await this.signatureAuditEventRepository.findById(auditEventId);
    if (!auditEvent) {
      throw auditEventNotFound(`Audit event with ID ${auditEventId.getValue()} not found`);
    }

    return auditEvent;
  }

  /**
   * Gets audit trail for an envelope
   * @param envelopeId - The envelope ID
   * @returns Array of signature audit events
   */
  async getAuditTrail(envelopeId: EnvelopeId): Promise<SignatureAuditEvent[]> {
    return this.signatureAuditEventRepository.findByEnvelopeId(envelopeId);
  }

  /**
   * Gets audit events by type
   * @param eventType - The event type
   * @returns Array of signature audit events
   */
  async getAuditEventsByType(eventType: AuditEventType): Promise<SignatureAuditEvent[]> {
    return this.signatureAuditEventRepository.findByEventType(eventType);
  }

  /**
   * Gets audit events for a specific signer
   * @param signerId - The signer ID
   * @returns Array of signature audit events
   */
  async getSignerAuditTrail(signerId: SignerId): Promise<SignatureAuditEvent[]> {
    return this.signatureAuditEventRepository.findBySignerId(signerId);
  }

  /**
   * Gets audit events by IP address
   * @param ipAddress - The IP address
   * @returns Array of signature audit events
   */
  async getAuditEventsByIpAddress(ipAddress: string): Promise<SignatureAuditEvent[]> {
    return this.signatureAuditEventRepository.findByIpAddress(ipAddress);
  }

  /**
   * Gets audit events by user agent
   * @param userAgent - The user agent
   * @returns Array of signature audit events
   */
  async getAuditEventsByUserAgent(userAgent: string): Promise<SignatureAuditEvent[]> {
    return this.signatureAuditEventRepository.findByUserAgent(userAgent);
  }

  /**
   * Gets audit events within a date range
   * @param startDate - Start date for the range
   * @param endDate - End date for the range
   * @returns Array of signature audit events
   */
  async getAuditEventsByDateRange(startDate: Date, endDate: Date): Promise<SignatureAuditEvent[]> {
    return this.signatureAuditEventRepository.findByTimestampRange(startDate, endDate);
  }

  /**
   * Counts audit events for an envelope
   * @param envelopeId - The envelope ID
   * @returns Number of audit events
   */
  async countAuditEventsByEnvelope(envelopeId: EnvelopeId): Promise<number> {
    return this.signatureAuditEventRepository.countByEnvelopeId(envelopeId);
  }

  /**
   * Validates audit event data for compliance
   * @param auditEvent - The audit event to validate
   * @returns void if valid, throws error if invalid
   */
  async validateAuditEvent(auditEvent: SignatureAuditEvent): Promise<void> {
    AuditEventValidationRule.validateAuditEvent(auditEvent);
  }

  /**
   * Gets audit events summary for reporting
   * @param envelopeId - The envelope ID
   * @returns Summary of audit events
   */
  async getAuditSummary(envelopeId: EnvelopeId): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: SignatureAuditEvent[];
    lastActivity: Date | null;
  }> {
    const allEvents = await this.getAuditTrail(envelopeId);
    const totalEvents = allEvents.length;
    
    const eventsByType: Record<string, number> = {};
    allEvents.forEach(event => {
      const eventType = event.getEventType();
      eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;
    });

    // Get recent events (last 24 hours)
    const oneDayAgo = new Date(Date.now() - (this.constructor as typeof SignatureAuditEventService).HOURS_IN_DAY * (this.constructor as typeof SignatureAuditEventService).MILLISECONDS_PER_HOUR);
    const recentEvents = allEvents.filter(event => event.getCreatedAt() > oneDayAgo);

    // Get last activity
    const lastActivity = allEvents.length > 0 
      ? allEvents.reduce((latest, event) => 
          event.getCreatedAt() > latest ? event.getCreatedAt() : latest, 
          allEvents[(this.constructor as typeof SignatureAuditEventService).FIRST_ELEMENT_INDEX].getCreatedAt()
        )
      : null;

    return {
      totalEvents,
      eventsByType,
      recentEvents,
      lastActivity
    };
  }

  /**
   * Gets all audit events for an envelope (no pagination)
   * @param envelopeId - Envelope ID
   * @returns Array of all audit event entities
   */
  async getAllByEnvelope(envelopeId: string): Promise<SignatureAuditEvent[]> {
    return this.signatureAuditEventRepository.getAllByEnvelope(envelopeId);
  }
}
