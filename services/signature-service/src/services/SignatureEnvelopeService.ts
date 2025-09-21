/**
 * @fileoverview SignatureEnvelopeService - Business logic service for signature envelope operations
 * @summary Provides business logic for envelope management using new architecture
 * @description This service handles all business logic for signature envelope operations
 * including CRUD operations, basic validations, and coordination with audit services using
 * the new Prisma-based architecture with proper separation of concerns.
 */

import { SignatureEnvelope } from '../domain/entities/SignatureEnvelope';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { EnvelopeStatus } from '../domain/value-objects/EnvelopeStatus';
import { SignatureEnvelopeRepository } from '../repositories/SignatureEnvelopeRepository';
import { SignatureAuditEventService } from './SignatureAuditEventService';
import { InvitationTokenService } from './InvitationTokenService';
import { EnvelopeSpec, S3Keys, Hashes, CreateEnvelopeData, UpdateEnvelopeData } from '../domain/types/envelope';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { Page } from '@lawprotect/shared-ts';
import { SignerStatus } from '@prisma/client';
import { 
  envelopeNotFound,
  envelopeCreationFailed,
  envelopeUpdateFailed,
  envelopeDeleteFailed,
  envelopeAccessDenied,
  invalidEnvelopeState
} from '../signature-errors';

/**
 * SignatureEnvelopeService implementation
 * 
 * Provides business logic for signature envelope operations including CRUD operations,
 * basic validations, and coordination with audit services. Uses the new Prisma-based
 * architecture with proper separation of concerns between entities, repositories, and services.
 * 
 * This service focuses on basic envelope management and delegates complex operations
 * to specialized services (DocumentSigningOrchestrator, EnvelopeProgressService, etc.).
 */
export class SignatureEnvelopeService {
  constructor(
    private readonly signatureEnvelopeRepository: SignatureEnvelopeRepository,
    private readonly signatureAuditEventService: SignatureAuditEventService,
    private readonly invitationTokenService: InvitationTokenService
  ) {}

  /**
   * Creates a new signature envelope
   * @param data - The envelope creation data
   * @param userId - The user creating the envelope
   * @returns The created signature envelope
   */
  async createEnvelope(data: CreateEnvelopeData, userId: string): Promise<SignatureEnvelope> {
    try {
      // Create envelope entity
      const envelope = new SignatureEnvelope(
        data.id,
        data.createdBy,
        data.title,
        data.description,
        EnvelopeStatus.draft(), // Initial status
        [], // signers will be added separately
        data.signingOrder,
        data.origin,
        undefined, // sourceKey
        undefined, // metaKey
        undefined, // flattenedKey
        undefined, // signedKey
        undefined, // sourceSha256
        undefined, // flattenedSha256
        undefined, // signedSha256
        undefined, // sentAt
        undefined, // completedAt
        undefined, // cancelledAt
        undefined, // declinedAt
        undefined, // declinedBySignerId
        undefined, // declinedReason
        data.expiresAt,
        new Date(), // createdAt
        new Date()  // updatedAt
      );

      // Save to repository
      const createdEnvelope = await this.signatureEnvelopeRepository.create(envelope);

      // Create audit event
      await this.signatureAuditEventService.createSignerAuditEvent(
        data.id.getValue(),
        data.createdBy.getValue(),
        AuditEventType.ENVELOPE_CREATED,
        `Envelope "${data.title}" created`,
        userId,
        undefined,
        undefined,
        undefined,
        {
          envelopeId: data.id.getValue(),
          title: data.title,
          signingOrder: data.signingOrder.toString(),
          originType: data.origin.getType(),
          expiresAt: data.expiresAt?.toISOString()
        }
      );

      return createdEnvelope;
    } catch (error) {
      throw envelopeCreationFailed(
        `Failed to create envelope: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets a signature envelope by ID
   * @param envelopeId - The envelope ID
   * @returns The signature envelope or null if not found
   */
  async getEnvelope(envelopeId: EnvelopeId): Promise<SignatureEnvelope | null> {
    try {
      return await this.signatureEnvelopeRepository.findById(envelopeId);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to get envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets a signature envelope with all signers
   * @param envelopeId - The envelope ID
   * @returns The signature envelope with signers or null if not found
   */
  async getEnvelopeWithSigners(envelopeId: EnvelopeId): Promise<SignatureEnvelope | null> {
    try {
      return await this.signatureEnvelopeRepository.getWithSigners(envelopeId);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to get envelope with signers ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets a signature envelope with all relations
   * @param envelopeId - The envelope ID
   * @returns The signature envelope with all relations or null if not found
   */
  async getEnvelopeWithAllRelations(envelopeId: EnvelopeId): Promise<SignatureEnvelope | null> {
    try {
      return await this.signatureEnvelopeRepository.getEnvelopeWithAllRelations(envelopeId);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to get envelope with all relations ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Updates a signature envelope
   * @param envelopeId - The envelope ID
   * @param updates - The updates to apply
   * @param userId - The user making the update
   * @returns The updated signature envelope
   */
  async updateEnvelope(envelopeId: EnvelopeId, updates: UpdateEnvelopeData, userId: string): Promise<SignatureEnvelope> {
    try {
      // Get existing envelope
      const existingEnvelope = await this.signatureEnvelopeRepository.findById(envelopeId);
      if (!existingEnvelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // Validate envelope can be modified using entity method
      if (!existingEnvelope.canBeModified()) {
        throw invalidEnvelopeState(`Envelope ${envelopeId.getValue()} cannot be modified in current state: ${existingEnvelope.getStatus().getValue()}`);
      }

      // Update envelope using repository's update method
      // The repository will handle the entity updates internally
      const updatedEnvelope = await this.signatureEnvelopeRepository.update(envelopeId, {
        title: updates.title,
        description: updates.description,
        expiresAt: updates.expiresAt,
        signingOrder: updates.signingOrder,
        updatedAt: new Date()
      } as any);

      // Create audit event
      await this.signatureAuditEventService.createSignerAuditEvent(
        envelopeId.getValue(),
        existingEnvelope.getCreatedBy().getValue(),
        AuditEventType.ENVELOPE_UPDATED,
        `Envelope "${existingEnvelope.getTitle()}" updated`,
        userId,
        undefined,
        undefined,
        undefined,
        {
          envelopeId: envelopeId.getValue(),
          updates: updates,
          previousTitle: existingEnvelope.getTitle()
        }
      );

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to update envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Deletes a signature envelope
   * @param envelopeId - The envelope ID
   * @param userId - The user deleting the envelope
   */
  async deleteEnvelope(envelopeId: EnvelopeId, userId: string): Promise<void> {
    try {
      // Get existing envelope
      const existingEnvelope = await this.signatureEnvelopeRepository.findById(envelopeId);
      if (!existingEnvelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // Validate envelope can be deleted using entity method
      if (!existingEnvelope.canBeModified()) {
        throw invalidEnvelopeState(`Envelope ${envelopeId.getValue()} cannot be deleted in current state: ${existingEnvelope.getStatus().getValue()}`);
      }

      // Delete envelope
      await this.signatureEnvelopeRepository.delete(envelopeId);

      // Create audit event
      await this.signatureAuditEventService.createSignerAuditEvent(
        envelopeId.getValue(),
        existingEnvelope.getCreatedBy().getValue(),
        AuditEventType.ENVELOPE_DELETED,
        `Envelope "${existingEnvelope.getTitle()}" deleted`,
        userId,
        undefined,
        undefined,
        undefined,
        {
          envelopeId: envelopeId.getValue(),
          title: existingEnvelope.getTitle()
        }
      );
    } catch (error) {
      throw envelopeDeleteFailed(
        `Failed to delete envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Lists envelopes by user
   * @param userId - The user ID
   * @param limit - Maximum number of results
   * @param cursor - Pagination cursor
   * @returns Page of signature envelopes
   */
  async listEnvelopesByUser(userId: string, limit: number, cursor?: string): Promise<Page<SignatureEnvelope>> {
    try {
      return await this.signatureEnvelopeRepository.findByCreatedBy(userId, limit, cursor);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to list envelopes for user ${userId}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Lists envelopes by status
   * @param status - The envelope status
   * @param limit - Maximum number of results
   * @param cursor - Pagination cursor
   * @returns Page of signature envelopes
   */
  async listEnvelopesByStatus(status: EnvelopeStatus, limit: number, cursor?: string): Promise<Page<SignatureEnvelope>> {
    try {
      return await this.signatureEnvelopeRepository.findByStatus(status, limit, cursor);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to list envelopes with status ${status.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Finds envelope by title and creator
   * @param title - The envelope title
   * @param userId - The user ID
   * @returns The signature envelope or null if not found
   */
  async findEnvelopeByTitleAndCreator(title: string, userId: string): Promise<SignatureEnvelope | null> {
    try {
      return await this.signatureEnvelopeRepository.findByTitleAndCreator(title, userId);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to find envelope with title "${title}" for user ${userId}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets expired envelopes
   * @param limit - Maximum number of results
   * @param cursor - Pagination cursor
   * @returns Page of expired signature envelopes
   */
  async getExpiredEnvelopes(limit: number, cursor?: string): Promise<Page<SignatureEnvelope>> {
    try {
      return await this.signatureEnvelopeRepository.findExpiredEnvelopes(limit, cursor);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to get expired envelopes: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Updates S3 keys for an envelope
   * @param envelopeId - The envelope ID
   * @param s3Keys - The S3 keys to update
   * @param userId - The user making the update
   * @returns The updated signature envelope
   */
  async updateS3Keys(envelopeId: EnvelopeId, s3Keys: S3Keys, userId: string): Promise<SignatureEnvelope> {
    try {
      const updatedEnvelope = await this.signatureEnvelopeRepository.updateS3Keys(envelopeId, s3Keys);

      // Create audit event
      await this.signatureAuditEventService.createSignerAuditEvent(
        envelopeId.getValue(),
        updatedEnvelope.getCreatedBy().getValue(),
        AuditEventType.ENVELOPE_UPDATED,
        `S3 keys updated for envelope "${updatedEnvelope.getTitle()}"`,
        userId,
        undefined,
        undefined,
        undefined,
        {
          envelopeId: envelopeId.getValue(),
          s3Keys: s3Keys
        }
      );

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to update S3 keys for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Updates hashes for an envelope
   * @param envelopeId - The envelope ID
   * @param hashes - The hashes to update
   * @param userId - The user making the update
   * @returns The updated signature envelope
   */
  async updateHashes(envelopeId: EnvelopeId, hashes: Hashes, userId: string): Promise<SignatureEnvelope> {
    try {
      const updatedEnvelope = await this.signatureEnvelopeRepository.updateHashes(envelopeId, hashes);

      // Create audit event
      await this.signatureAuditEventService.createSignerAuditEvent(
        envelopeId.getValue(),
        updatedEnvelope.getCreatedBy().getValue(),
        AuditEventType.ENVELOPE_UPDATED,
        `Document hashes updated for envelope "${updatedEnvelope.getTitle()}"`,
        userId,
        undefined,
        undefined,
        undefined,
        {
          envelopeId: envelopeId.getValue(),
          hashes: hashes
        }
      );

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to update hashes for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Updates signed document for an envelope
   * @param envelopeId - The envelope ID
   * @param signedKey - The signed document S3 key
   * @param signedSha256 - The signed document hash
   * @param userId - The user making the update
   * @returns The updated signature envelope
   */
  async updateSignedDocument(envelopeId: EnvelopeId, signedKey: string, signedSha256: string, userId: string): Promise<SignatureEnvelope> {
    try {
      const updatedEnvelope = await this.signatureEnvelopeRepository.updateSignedDocument(envelopeId, signedKey, signedSha256);

      // Create audit event
      await this.signatureAuditEventService.createSignerAuditEvent(
        envelopeId.getValue(),
        updatedEnvelope.getCreatedBy().getValue(),
        AuditEventType.ENVELOPE_UPDATED,
        `Signed document updated for envelope "${updatedEnvelope.getTitle()}"`,
        userId,
        undefined,
        undefined,
        undefined,
        {
          envelopeId: envelopeId.getValue(),
          signedKey: signedKey,
          signedSha256: signedSha256
        }
      );

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to update signed document for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Counts envelopes by user
   * @param userId - The user ID
   * @returns Number of envelopes
   */
  async countEnvelopesByUser(userId: string): Promise<number> {
    try {
      return await this.signatureEnvelopeRepository.countByCreatedBy(userId);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to count envelopes for user ${userId}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Checks if envelope exists by title and creator
   * @param title - The envelope title
   * @param userId - The user ID
   * @returns True if envelope exists
   */
  async envelopeExistsByTitleAndCreator(title: string, userId: string): Promise<boolean> {
    try {
      return await this.signatureEnvelopeRepository.existsByTitleAndCreator(title, userId);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to check if envelope exists with title "${title}" for user ${userId}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Checks if envelope exists by ID
   * @param envelopeId - The envelope ID
   * @returns True if envelope exists
   */
  async envelopeExists(envelopeId: EnvelopeId): Promise<boolean> {
    try {
      return await this.signatureEnvelopeRepository.existsById(envelopeId);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to check if envelope exists ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Validates user access to envelope (for authenticated users only)
   * @param envelopeId - The envelope ID
   * @param userId - The user ID
   * @returns The envelope if access is valid
   * @throws EnvelopeAccessDenied if user doesn't have access
   */
  async validateEnvelopeAccess(envelopeId: EnvelopeId, userId: string): Promise<SignatureEnvelope> {
    try {
      const envelope = await this.signatureEnvelopeRepository.findById(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // Check if user is the creator
      if (envelope.getCreatedBy().getValue() !== userId) {
        throw envelopeAccessDenied(`User ${userId} does not have access to envelope ${envelopeId.getValue()}`);
      }

      return envelope;
    } catch (error) {
      if (error instanceof Error && error.message.includes('access')) {
        throw error;
      }
      throw envelopeAccessDenied(
        `Failed to validate access to envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Validates external user access to envelope using invitation token
   * @param envelopeId - The envelope ID
   * @param invitationToken - The invitation token
   * @returns The envelope if access is valid
   * @throws EnvelopeAccessDenied if user doesn't have access
   */
  async validateExternalUserAccess(envelopeId: EnvelopeId, invitationToken: string): Promise<SignatureEnvelope> {
    try {
      // Validate invitation token
      const token = await this.invitationTokenService.validateInvitationToken(invitationToken);
      
      // Verify token is for this envelope
      if (token.getEnvelopeId().getValue() !== envelopeId.getValue()) {
        throw envelopeAccessDenied(`Invitation token is not valid for envelope ${envelopeId.getValue()}`);
      }

      // Get envelope
      const envelope = await this.signatureEnvelopeRepository.findById(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      return envelope;
    } catch (error) {
      if (error instanceof Error && error.message.includes('access')) {
        throw error;
      }
      throw envelopeAccessDenied(
        `Failed to validate external user access to envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Validates user access to envelope (supports both authenticated and external users)
   * @param envelopeId - The envelope ID
   * @param userId - The user ID (for authenticated users)
   * @param invitationToken - The invitation token (for external users)
   * @returns The envelope if access is valid
   * @throws EnvelopeAccessDenied if user doesn't have access
   */
  async validateUserAccess(envelopeId: EnvelopeId, userId?: string, invitationToken?: string): Promise<SignatureEnvelope> {
    if (invitationToken) {
      // External user with invitation token
      return this.validateExternalUserAccess(envelopeId, invitationToken);
    } else if (userId) {
      // Authenticated user
      return this.validateEnvelopeAccess(envelopeId, userId);
    } else {
      throw envelopeAccessDenied('Either userId or invitationToken must be provided for access validation');
    }
  }

  /**
   * Lists envelopes by specification
   * @param spec - The search specification
   * @param limit - Maximum number of results
   * @param cursor - Pagination cursor
   * @returns List of signature envelopes with pagination
   */
  async listEnvelopes(spec: EnvelopeSpec, limit: number, cursor?: string): Promise<{ items: SignatureEnvelope[]; nextCursor?: string }> {
    try {
      return await this.signatureEnvelopeRepository.list(spec, limit, cursor);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to list envelopes with specification: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets envelope with signers of specific status
   * @param envelopeId - The envelope ID
   * @param status - The signer status to filter by
   * @returns The signature envelope with filtered signers or null if not found
   */
  async getEnvelopeWithSignersByStatus(envelopeId: EnvelopeId, status: SignerStatus): Promise<SignatureEnvelope | null> {
    try {
      return await this.signatureEnvelopeRepository.getWithSignersAndStatus(envelopeId, status);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to get envelope with signers by status ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets envelope with audit events
   * @param envelopeId - The envelope ID
   * @param limit - Maximum number of audit events
   * @param cursor - Pagination cursor
   * @returns The signature envelope with audit events or null if not found
   */
  async getEnvelopeWithAuditEvents(envelopeId: EnvelopeId, limit: number, cursor?: string): Promise<SignatureEnvelope | null> {
    try {
      return await this.signatureEnvelopeRepository.getEnvelopeWithAuditEvents(envelopeId, limit, cursor);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to get envelope with audit events ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets envelope with consents
   * @param envelopeId - The envelope ID
   * @returns The signature envelope with consents or null if not found
   */
  async getEnvelopeWithConsents(envelopeId: EnvelopeId): Promise<SignatureEnvelope | null> {
    try {
      return await this.signatureEnvelopeRepository.getEnvelopeWithConsents(envelopeId);
    } catch (error) {
      throw envelopeNotFound(
        `Failed to get envelope with consents ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }
}
