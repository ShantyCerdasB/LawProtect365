/**
 * @fileoverview EnvelopeService - Business logic service for envelope operations
 * @summary Provides business logic for envelope management
 * @description This service handles all business logic for envelope operations
 * including creation, updates, status management, and business rule validation.
 */

import { Envelope } from '../domain/entities/Envelope';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { EnvelopeStatus } from '../domain/enums/EnvelopeStatus';
import { EnvelopeOperation } from '../domain/enums/EnvelopeOperation';
import { SigningOrder } from '../domain/value-objects/SigningOrder';
import { uuid } from '@lawprotect/shared-ts';
import { EnvelopeRepository } from '../repositories/EnvelopeRepository';
import { SignerRepository } from '../repositories/SignerRepository';
import { SignatureRepository } from '../repositories/SignatureRepository';
import { AuditService } from './AuditService';
import { EnvelopeEventService } from './events/EnvelopeEventService';
import { 
  CreateEnvelopeRequest,
  UpdateEnvelopeRequest,
  EnvelopeSecurityContext
} from '../domain/types/envelope';
import { NotFoundError, ErrorCodes } from '@lawprotect/shared-ts';
import { AuditEventType } from '../domain/enums/AuditEventType';
import type { SignatureServiceConfig } from '../config';


// Domain Rules
import { 
  validateEnvelopeBusinessRules,
  validateEnvelopeComprehensive
} from '../domain/rules/envelope/EnvelopeBusinessRules';
import { validateEnvelopeStateTransition } from '../domain/rules/envelope/EnvelopeStateTransitionRules';
import { validateEnvelopeAccessPermissions } from '../domain/rules/envelope/EnvelopeSecurityRules';

/**
 * EnvelopeService implementation
 * 
 * Provides business logic for envelope operations including validation,
 * status management, and coordination with other services.
 */
export class EnvelopeService {
  constructor(
    private readonly envelopeRepository: EnvelopeRepository,
    private readonly signerRepository: SignerRepository,
    private readonly signatureRepository: SignatureRepository,
    private readonly auditService: AuditService,
    private readonly eventService: EnvelopeEventService,
    private readonly config: SignatureServiceConfig,
    private readonly documentRepository?: {
      getDocument: (id: string) => Promise<{
        documentId: string;
        status: string;
        s3Key: string;
        ownerId: string;
      } | null>;
    }
  ) {}


  /**
   * Creates a new envelope
   * @param request - The create envelope request
   * @param userId - The user creating the envelope
   * @param context - Security context from SecurityContextMiddleware
   * @returns The created envelope
   */
  async createEnvelope(
    request: CreateEnvelopeRequest, 
    userId: string,
    context: EnvelopeSecurityContext
  ): Promise<Envelope> {

    // Get existing envelopes for validation
    const existingEnvelopes = await this.envelopeRepository.listByOwner(userId, { limit: 1000 });
    const existingTitles = existingEnvelopes.items.map((e: any) => e.title);

    // Validate business rules using domain rules
    await validateEnvelopeBusinessRules({
      signerCount: request.signers?.length || 0,
      ownerId: userId,
      title: request.title,
      existingTitles,
      expiresAt: request.expiresAt,
      metadata: {
        title: request.title,
        description: request.description,
        customFields: request.customFields,
        tags: request.tags
      },
      documentId: request.documentHash,
      currentStatus: EnvelopeStatus.DRAFT,
      operation: EnvelopeOperation.CREATE
    }, this.config, this.documentRepository || { getDocument: async () => null });

    // Create envelope entity
    const envelope = new Envelope(
      new EnvelopeId(uuid()),
      request.documentHash, // documentId
      userId, // ownerId
      EnvelopeStatus.DRAFT, // status
      [], // signers (empty initially)
      SigningOrder.ownerFirst(), // signingOrder (default)
      new Date(), // createdAt
      new Date(), // updatedAt
      {
        title: request.title,
        description: request.description,
        expiresAt: request.expiresAt
      }, // metadata
      undefined // completedAt
    );

    // Save envelope
    const createdEnvelope = await this.envelopeRepository.create(envelope);

    // Create audit event
    await this.auditService.createEvent({
      type: AuditEventType.ENVELOPE_CREATED,
      envelopeId: createdEnvelope.getId().getValue(),
      userId: context.userId,
      metadata: {
        title: request.title,
        documentHash: request.documentHash,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      },
      description: `Envelope created: ${request.title}`
    });

    // Publish event
    await this.eventService.publishEvent('envelope.created', {
      envelopeId: createdEnvelope.getId().getValue(),
      userId,
      title: request.title,
      status: EnvelopeStatus.DRAFT
    });

    return createdEnvelope;
  }

  /**
   * Updates an envelope
   * @param envelopeId - The envelope ID
   * @param request - The update request
   * @param userId - The user updating the envelope
   * @param context - Security context from SecurityContextMiddleware
   * @returns The updated envelope
   */
  async updateEnvelope(
    envelopeId: EnvelopeId, 
    request: UpdateEnvelopeRequest, 
    userId: string,
    context: EnvelopeSecurityContext
  ): Promise<Envelope> {
    // Get existing envelope
    const existingEnvelope = await this.envelopeRepository.getById(envelopeId);
    if (!existingEnvelope) {
      throw new NotFoundError(
        `Envelope with ID ${envelopeId.getValue()} not found`,
        ErrorCodes.COMMON_NOT_FOUND
      );
    }

    // Use comprehensive validation
    await validateEnvelopeComprehensive(
      existingEnvelope,
      EnvelopeOperation.UPDATE,
      context,
      this.config,
      {
        documentRepository: this.documentRepository
      }
    );

    // Update envelope
    const updatedEnvelope = await this.envelopeRepository.update(envelopeId, {
      metadata: {
        title: request.title,
        description: request.description,
        expiresAt: request.expiresAt,
        customFields: request.customFields,
        tags: request.tags,
        reminders: request.reminders
      }
    } as Partial<Envelope>);

    // Create audit event
    await this.auditService.createEvent({
      type: AuditEventType.ENVELOPE_UPDATED,
      envelopeId: envelopeId.getValue(),
      userId,
      metadata: {
        changes: request
      },
      description: `Envelope updated: ${envelopeId.getValue()}`
    });

    // Publish event
    await this.eventService.publishEvent('envelope.updated', {
      envelopeId: envelopeId.getValue(),
      userId,
      changes: request
    });

    return updatedEnvelope;
  }

  /**
   * Gets an envelope by ID
   * @param envelopeId - The envelope ID
   * @param userId - The user requesting the envelope
   * @param context - Security context from SecurityContextMiddleware
   * @returns The envelope
   */
  async getEnvelope(
    envelopeId: EnvelopeId, 
    _userId: string,
    context: EnvelopeSecurityContext
  ): Promise<Envelope> {
    const envelope = await this.envelopeRepository.getById(envelopeId);
    if (!envelope) {
      throw new NotFoundError(
        `Envelope with ID ${envelopeId.getValue()} not found`,
        ErrorCodes.COMMON_NOT_FOUND
      );
    }

    // Validate access permissions using domain rules
    validateEnvelopeAccessPermissions({
      userId: context.userId,
      accessType: context.accessType,
      permission: context.permission,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      timestamp: context.timestamp
    }, EnvelopeOperation.UPDATE, envelope.getOwnerId());

    return envelope;
  }

  /**
   * Deletes an envelope
   * @param envelopeId - The envelope ID
   * @param userId - The user deleting the envelope
   * @param context - Security context from SecurityContextMiddleware
   */
  async deleteEnvelope(
    envelopeId: EnvelopeId, 
    userId: string,
    context: EnvelopeSecurityContext
  ): Promise<void> {
    // Get existing envelope
    const envelope = await this.envelopeRepository.getById(envelopeId);
    if (!envelope) {
      throw new NotFoundError(
        `Envelope with ID ${envelopeId.getValue()} not found`,
        ErrorCodes.COMMON_NOT_FOUND
      );
    }

    // Use comprehensive validation
    await validateEnvelopeComprehensive(
      envelope,
      EnvelopeOperation.CANCEL,
      context,
      this.config,
      {
        documentRepository: this.documentRepository
      }
    );

    // Delete related entities first
    await this.deleteRelatedEntities(envelopeId);

    // Delete envelope
    await this.envelopeRepository.delete(envelopeId);

    // Create audit event
    await this.auditService.createEvent({
      type: AuditEventType.ENVELOPE_DELETED,
      envelopeId: envelopeId.getValue(),
      userId,
      metadata: {
        title: envelope.getMetadata().title
      },
      description: `Envelope deleted: ${envelope.getMetadata().title}`
    });

    // Publish event
    await this.eventService.publishEvent('envelope.deleted', {
      envelopeId: envelopeId.getValue(),
      userId
    });
  }

  /**
   * Changes envelope status
   * @param envelopeId - The envelope ID
   * @param newStatus - The new status
   * @param userId - The user changing the status
   * @param context - Security context from SecurityContextMiddleware
   * @returns The updated envelope
   */
  async changeEnvelopeStatus(
    envelopeId: EnvelopeId, 
    newStatus: EnvelopeStatus, 
    userId: string,
    context: EnvelopeSecurityContext
  ): Promise<Envelope> {
    // Get existing envelope
    const envelope = await this.envelopeRepository.getById(envelopeId);
    if (!envelope) {
      throw new NotFoundError(
        `Envelope with ID ${envelopeId.getValue()} not found`,
        ErrorCodes.COMMON_NOT_FOUND
      );
    }

    // Use comprehensive validation
    await validateEnvelopeComprehensive(
      envelope,
      EnvelopeOperation.UPDATE,
      context,
      this.config,
      {
        documentRepository: this.documentRepository
      }
    );

    // Validate state transition using domain rules
    validateEnvelopeStateTransition(envelope, newStatus);

    // Update status
    const updatedEnvelope = await this.envelopeRepository.update(envelopeId, {
      status: newStatus
    } as Partial<Envelope>);

    // Create audit event
    await this.auditService.createEvent({
      type: AuditEventType.ENVELOPE_STATUS_CHANGED,
      envelopeId: envelopeId.getValue(),
      userId,
      metadata: {
        oldStatus: envelope.getStatus(),
        newStatus
      },
      description: `Envelope status changed from ${envelope.getStatus()} to ${newStatus}`
    });

    // Publish event
    await this.eventService.publishEvent('envelope.status_changed', {
      envelopeId: envelopeId.getValue(),
      userId,
      oldStatus: envelope.getStatus(),
      newStatus
    });

    return updatedEnvelope;
  }

  /**
   * Gets envelopes for a user
   * @param userId - The user ID
   * @param limit - Maximum number of envelopes to return
   * @param cursor - Pagination cursor
   * @returns List of envelopes
   */
  async getUserEnvelopes(userId: string, limit: number = 25, cursor?: string) {
    return this.envelopeRepository.listByOwner(userId, { limit, cursor });
  }


  /**
   * Deletes related entities
   * @param envelopeId - The envelope ID
   */
  private async deleteRelatedEntities(envelopeId: EnvelopeId): Promise<void> {
    // Delete signatures
    const signatures = await this.signatureRepository.getByEnvelope(envelopeId.getValue());
    for (const signature of signatures.items) {
      await this.signatureRepository.delete(signature.id as any);
    }

    // Delete signers
    const signers = await this.signerRepository.getByEnvelope(envelopeId.getValue());
    for (const signer of signers.items) {
      await this.signerRepository.delete(signer.id as any);
    }
  }
}