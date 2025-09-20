/**
 * @fileoverview EnvelopeService - Business logic service for envelope operations
 * @summary Provides business logic for envelope management
 * @description This service handles all business logic for envelope operations
 * including creation, updates, status management, and business rule validation.
 */

import { Envelope } from '../domain/entities/Envelope';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignatureId } from '../domain/value-objects/SignatureId';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeStatus } from '../domain/enums/EnvelopeStatus';
import { EnvelopeOperation } from '../domain/enums/EnvelopeOperation';
import { SigningOrder } from '../domain/value-objects/SigningOrder';
import { uuid, NotFoundError, ErrorCodes, PermissionLevel, AccessType } from '@lawprotect/shared-ts';
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
import { AuditEventType } from '../domain/enums/AuditEventType';
import type { SignatureServiceConfig } from '../config';


// Domain Rules
import { 
  validateEnvelopeBusinessRules,
  validateEnvelopeComprehensive
} from '../domain/rules/envelope/EnvelopeBusinessRules';
import { 
  validateEnvelopeStateTransition,
  validateCompletionRequirements
} from '../domain/rules/envelope/EnvelopeStateTransitionRules';
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

    // Create audit event (persisted synchronously)
    await this.auditService.createEvent({
      type: AuditEventType.ENVELOPE_CREATED,
      envelopeId: createdEnvelope.getId().getValue(),
      userId: context.userId,
      userEmail: (context as any)?.email,
      metadata: {
        title: request.title,
        documentId: request.documentHash,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      },
      description: `Envelope created: ${request.title}`
    });

    // Publish event only when useful for other services (e.g., multi-signer or external signers)
    try {
      const signers = await this.signerRepository.getByEnvelope(createdEnvelope.getId().getValue());
      const signerItems = (signers as any)?.items ?? [];
      const shouldPublish = signerItems.length > 1;
      if (shouldPublish) {
        await this.eventService.publishEvent('envelope.created', {
          envelopeId: createdEnvelope.getId().getValue(),
          userId,
          title: request.title,
          status: EnvelopeStatus.DRAFT
        });
      }
    } catch (error) {
      // Ignore publish errors to prevent envelope creation from failing
    }

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

    // Create audit event (persisted synchronously)
    await this.auditService.createEvent({
      type: AuditEventType.ENVELOPE_UPDATED,
      envelopeId: envelopeId.getValue(),
      userId,
      userEmail: (context as any)?.email,
      metadata: {
        changes: request
      },
      description: `Envelope updated: ${envelopeId.getValue()}`
    });

    // Conditional publish
    try {
      const signers = await this.signerRepository.getByEnvelope(envelopeId.getValue());
      const shouldPublish = ((signers as any)?.items ?? []).length > 1;
      if (shouldPublish) {
        await this.eventService.publishEvent('envelope.updated', {
          envelopeId: envelopeId.getValue(),
          userId,
          changes: request
        });
      }
    } catch (error) {
      // Ignore publish errors to prevent envelope update from failing
    }

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

    // Validate access permissions using domain rules for READ
    validateEnvelopeAccessPermissions({
      userId: context.userId,
      accessType: context.accessType,
      permission: context.permission,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      timestamp: context.timestamp
    }, EnvelopeOperation.READ, envelope.getOwnerId());

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

    // Create audit event (persisted synchronously)
    await this.auditService.createEvent({
      type: AuditEventType.ENVELOPE_STATUS_CHANGED,
      envelopeId: envelopeId.getValue(),
      userId,
      userEmail: (context as any)?.email,
      metadata: {
        oldStatus: envelope.getStatus(),
        newStatus
      },
      description: `Envelope status changed from ${envelope.getStatus()} to ${newStatus}`
    });

    // Conditional publish
    try {
      const signers = await this.signerRepository.getByEnvelope(envelopeId.getValue());
      const shouldPublish = ((signers as any)?.items ?? []).length > 1;
      if (shouldPublish) {
        await this.eventService.publishEvent('envelope.status_changed', {
          envelopeId: envelopeId.getValue(),
          userId,
          oldStatus: envelope.getStatus(),
          newStatus
        });
      }
    } catch (error) {
      // Ignore publish errors to prevent envelope status change from failing
    }

    return updatedEnvelope;
  }

  /**
   * Attempts to complete the envelope if all signers and signatures are completed
   * @param envelopeId - The envelope ID to complete
   * @param context - Security context for authorization
   * @returns The envelope (completed if requirements met, unchanged otherwise)
   * @throws NotFoundError when envelope is not found
   */
  async completeIfAllSigned(
    envelopeId: EnvelopeId,
    context: EnvelopeSecurityContext
  ): Promise<Envelope> {
    const envelope = await this.envelopeRepository.getById(envelopeId);
    if (!envelope) {
      throw new NotFoundError(
        `Envelope with ID ${envelopeId.getValue()} not found`,
        ErrorCodes.COMMON_NOT_FOUND
      );
    }

    try {
      const signatures = await this.signatureRepository.getByEnvelope(envelopeId.getValue());
      const signatureItems = signatures.items;

      // Load signers from repository to ensure we have the most up-to-date data
      const signers = await this.signerRepository.getByEnvelope(envelopeId.getValue());
      const signerItems = signers.items;

      // Debug: Log signature and signer counts
      console.log(`[DEBUG] Envelope ${envelopeId.getValue()}:`, {
        signerCount: signerItems.length,
        signatureCount: signatureItems.length,
        signerStatuses: signerItems.map(s => (s as any).getStatus?.() || (s as any).status),
        signatureStatuses: signatureItems.map(s => (s as any).getStatus?.() || (s as any).status)
      });

      validateCompletionRequirements(envelope, signatureItems);

      const ownerId = envelope.getOwnerId();
      const ownerContext: EnvelopeSecurityContext = {
        ...context,
        userId: ownerId,
        permission: PermissionLevel.OWNER,
        accessType: AccessType.DIRECT
      };

      let current = envelope;
      
      if (current.getStatus() === EnvelopeStatus.DRAFT) {
        current = await this.changeEnvelopeStatus(envelopeId, EnvelopeStatus.SENT, ownerId, ownerContext);
      }

      if (current.getStatus() !== EnvelopeStatus.COMPLETED) {
        validateEnvelopeStateTransition(current, EnvelopeStatus.COMPLETED);
        
        const completedAt = new Date();
        await this.envelopeRepository.update(envelopeId, { 
          status: EnvelopeStatus.COMPLETED,
          completedAt
        } as Partial<Envelope>);

        await this.auditService.createEvent({
          type: AuditEventType.ENVELOPE_COMPLETED,
          envelopeId: envelopeId.getValue(),
          userId: ownerId,
          userEmail: (context as any)?.email,
          metadata: { 
            oldStatus: current.getStatus(), 
            newStatus: EnvelopeStatus.COMPLETED,
            completedAt: completedAt.toISOString()
          },
          description: `Envelope completed: ${envelope.getMetadata().title}`
        });

        try {
          const signersForEvent = await this.signerRepository.getByEnvelope(envelopeId.getValue());
          const shouldPublish = signersForEvent.items.length > 1;
          if (shouldPublish) {
            const completedEnvelope = await this.envelopeRepository.getById(envelopeId);
            if (completedEnvelope) {
              await this.eventService.publishEnvelopeCompleted(completedEnvelope, completedAt);
            }
          }
        } catch (error) {
          // Ignore publish errors to prevent envelope completion from failing
        }
        
        current = await this.envelopeRepository.getById(envelopeId) as Envelope;
      }

      return current;
    } catch (error) {
      // If completion requirements are not met, return the envelope unchanged
      return envelope;
    }
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
    for (const signature of signatures.items as any[]) {
      await this.signatureRepository.delete(new SignatureId(signature.signatureId));
    }

    // Delete signers
    const signers = await this.signerRepository.getByEnvelope(envelopeId.getValue());
    for (const signer of signers.items as any[]) {
      await this.signerRepository.delete(new SignerId(signer.signerId));
    }
  }
}