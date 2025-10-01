/**
 * @fileoverview AuditEventService - Business logic service for audit event operations
 * @summary Provides business logic for audit event management
 * @description Handles creation, retrieval, and audit trail management using the Prisma-based repository.
 */

import { SignatureAuditEvent } from '@/domain/entities/SignatureAuditEvent';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { SignatureAuditEventRepository } from '@/repositories/SignatureAuditEventRepository';
import { CreateAuditEventRequest } from '@/domain/types/audit/CreateAuditEventRequest';
import { auditEventCreationFailed } from '@/signature-errors';

/**
 * Service for managing signature audit events.
 *
 * Provides business logic for audit event creation and retrieval.
 */
export class AuditEventService {
  /**
   * Creates an instance of AuditEventService.
   * @param signatureAuditEventRepository - Repository for persistence operations.
   */
  constructor(
    private readonly signatureAuditEventRepository: SignatureAuditEventRepository
  ) {}


  /**
   * Creates an audit event for signer-related operations using Value Objects.
   * Uses the entity's create method with proper domain validation.
   *
   * @param config - Configuration containing envelope, signer, event, user and network context data.
   * @returns The created SignatureAuditEvent.
   * @throws Error if validation or persistence fails.
   * @example
   * const auditEvent = await service.createSignerEvent({
   *   envelopeId: 'env-123',
   *   signerId: 'signer-456',
   *   eventType: AuditEventType.SIGNER_ADDED,
   *   description: 'Signer added to envelope',
   *   userId: 'user-789',
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0',
   *   country: 'US'
   * });
   */
  async createSignerEvent(
    config: {
      envelopeId: string;
      signerId: string;
      eventType: AuditEventType;
      description: string;
      userId: string;
      userEmail?: string;
      metadata?: Record<string, unknown>;
    } & NetworkSecurityContext
  ): Promise<SignatureAuditEvent> {
    // Convert strings to Value Objects and use entity's create method
    const envelopeId = EnvelopeId.fromString(config.envelopeId);
    const signerId = SignerId.fromString(config.signerId);
    
    // Create network context from individual fields
    const networkContext: NetworkSecurityContext = {
      ipAddress: config.ipAddress,
      userAgent: config.userAgent,
      country: config.country
    };
    
    const auditEvent = SignatureAuditEvent.create({
      envelopeId,
      signerId,
      eventType: config.eventType,
      description: config.description,
      userId: config.userId,
      userEmail: config.userEmail,
      networkContext,
      metadata: config.metadata
    });

    return await this.signatureAuditEventRepository.create(auditEvent);
  }

  /**
   * Creates a new audit event with full validation using the entity's createFromPrimitives method.
   * This method handles string inputs from external layers and delegates validation to the entity.
   *
   * @param request - Create audit event request with all necessary data.
   * @returns The created SignatureAuditEvent.
   * @throws Error when validation fails or repository creation fails.
   * @example
   * const auditEvent = await service.create({
   *   envelopeId: 'env-123',
   *   signerId: 'signer-456',
   *   eventType: AuditEventType.ENVELOPE_CREATED,
   *   description: 'Envelope created successfully',
   *   userId: 'user-789',
   *   userEmail: 'user@example.com',
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0',
   *   country: 'US',
   *   metadata: { source: 'web' }
   * });
   */
  async create(request: CreateAuditEventRequest): Promise<SignatureAuditEvent> {
    try {
      // Use the entity's createFromPrimitives method which handles all validation
      const auditEvent = SignatureAuditEvent.createFromPrimitives({
        envelopeId: request.envelopeId,
        signerId: request.signerId,
        eventType: request.eventType,
        description: request.description,
        userId: request.userId,
        userEmail: request.userEmail,
        ipAddress: request.networkContext?.ipAddress,
        userAgent: request.networkContext?.userAgent,
        country: request.networkContext?.country,
        metadata: request.metadata
      });

      return await this.signatureAuditEventRepository.create(auditEvent);
    } catch (error) {
      throw auditEventCreationFailed(
        `Failed to create audit event: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Retrieves all audit events for a specific envelope without pagination.
   *
   * @param envelopeId - Unique identifier of the envelope.
   * @returns An array of SignatureAuditEvent entities.
   * @throws Error if the envelope ID is invalid or retrieval fails.
   * @example
   * const events = await service.getByEnvelope('env-123');
   */
  async getByEnvelope(envelopeId: string): Promise<SignatureAuditEvent[]> {
    return this.signatureAuditEventRepository.getByEnvelope(envelopeId);
  }
}
