/**
 * @fileoverview SignatureAuditEventService - Business logic service for audit event operations
 * @summary Provides business logic for signature audit event management
 * @description This service handles all business logic for signature audit events,
 * including creation, retrieval, and audit trail management using the new Prisma-based architecture.
 */

import { SignatureAuditEvent } from '@/domain/entities/SignatureAuditEvent';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import { NetworkSecurityContext, createNetworkSecurityContext } from '@lawprotect/shared-ts';
import { SignatureAuditEventRepository } from '@/repositories/SignatureAuditEventRepository';
import { CreateAuditEventRequest } from '@/domain/types/audit/CreateAuditEventRequest';
import { AuditEventValidationRule } from '@/domain/rules/AuditEventValidationRule';
import { 
  auditEventCreationFailed
} from '@/signature-errors';

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
   * @param config - Configuration object containing envelopeId, signerId, eventType, description, userId, userEmail, metadata and network security context
   * @returns Promise that resolves to the created SignatureAuditEvent
   * @throws Error when audit event creation fails
   * @example
   * const auditEvent = await service.createSignerAuditEvent({
   *   envelopeId: 'env-123',
   *   signerId: 'signer-456',
   *   eventType: AuditEventType.SIGNER_ADDED,
   *   description: 'Signer added to envelope',
   *   userId: 'user-789',
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0...',
   *   country: 'US'
   * });
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
        metadata: config.metadata || {},
        networkContext: undefined
    });
  }

  /**
   * Creates a new signature audit event with full validation
   * @param request - The create audit event request containing all necessary audit event data
   * @returns Promise that resolves to the created SignatureAuditEvent
   * @throws Error when validation fails or audit event creation fails
   * @example
   * const auditEvent = await service.createEvent({
   *   envelopeId: 'env-123',
   *   signerId: 'signer-456',
   *   eventType: AuditEventType.ENVELOPE_CREATED,
   *   description: 'Envelope created successfully',
   *   userId: 'user-789',
   *   userEmail: 'user@example.com',
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0...',
   *   country: 'US',
   *   metadata: { source: 'web' }
   * });
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
        networkContext: createNetworkSecurityContext(
          request.ipAddress,
          request.userAgent,
          request.country
        ),
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
   * Retrieves all audit events for a specific envelope without pagination
   * @param envelopeId - The unique identifier of the envelope to retrieve audit events for
   * @returns Promise that resolves to an array of SignatureAuditEvent entities
   * @throws Error when envelope ID is invalid or retrieval fails
   * @example
   * const auditEvents = await service.getAllByEnvelope('env-123');
   * console.log(`Found ${auditEvents.length} audit events for envelope`);
   */
  async getAllByEnvelope(envelopeId: string): Promise<SignatureAuditEvent[]> {
    return this.signatureAuditEventRepository.getByEnvelope(envelopeId);
  }
}
