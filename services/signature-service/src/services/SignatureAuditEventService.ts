/**
 * @fileoverview SignatureAuditEventService - Business logic service for audit event operations
 * @summary Provides business logic for signature audit event management
 * @description This service handles all business logic for signature audit events,
 * including creation, retrieval, and audit trail management using the new Prisma-based architecture.
 */

import { SignatureAuditEvent } from '../domain/entities/SignatureAuditEvent';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerId } from '../domain/value-objects/SignerId';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { SignatureAuditEventRepository } from '../repositories/SignatureAuditEventRepository';
import { CreateAuditEventRequest } from '../domain/types/audit/CreateAuditEventRequest';
import { AuditEventValidationRule } from '../domain/rules/AuditEventValidationRule';
import { 
  auditEventCreationFailed
} from '../signature-errors';

/**
 * SignatureAuditEventService implementation
 * 
 * Provides business logic for signature audit event operations including creation,
 * retrieval, and audit trail management. Uses the new Prisma-based SignatureAuditEventRepository.
 */
export class SignatureAuditEventService {
  
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
    metadata?: Record<string, unknown>;
  } & NetworkSecurityContext): Promise<SignatureAuditEvent> {
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
   * Gets all audit events for an envelope (no pagination)
   * @param envelopeId - Envelope ID
   * @returns Array of all audit event entities
   */
  async getAllByEnvelope(envelopeId: string): Promise<SignatureAuditEvent[]> {
    return this.signatureAuditEventRepository.getAllByEnvelope(envelopeId);
  }
}
