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
import { SigningOrder } from '../domain/value-objects/SigningOrder';
import { S3Key } from '../domain/value-objects/S3Key';
import { SignerId } from '../domain/value-objects/SignerId';
import { SignatureEnvelopeRepository } from '../repositories/SignatureEnvelopeRepository';
import { SignatureAuditEventService } from './SignatureAuditEventService';
import { InvitationTokenService } from './InvitationTokenService';
import { S3Service } from './S3Service';
import { EntityFactory } from '../domain/factories/EntityFactory';
import { EnvelopeUpdateValidationRule, UpdateEnvelopeData } from '../domain/rules/EnvelopeUpdateValidationRule';
import { EnvelopeSpec, S3Keys, Hashes, CreateEnvelopeData } from '../domain/types/envelope';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { AccessType } from '../domain/enums/AccessType';
import { Page, wrapServiceError, sha256Hex } from '@lawprotect/shared-ts';
import { SignerStatus, SigningOrderType } from '@prisma/client';
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
    private readonly invitationTokenService: InvitationTokenService,
    private readonly s3Service: S3Service
  ) {}

  /**
   * Creates a new signature envelope
   * @param data - The envelope creation data
   * @param userId - The user creating the envelope
   * @returns The created signature envelope
   */
  async createEnvelope(data: CreateEnvelopeData, userId: string): Promise<SignatureEnvelope> {
    try {
      // Create envelope entity using EntityFactory
      const envelope = EntityFactory.createSignatureEnvelope(data);

      // Save to repository
      const createdEnvelope = await this.signatureEnvelopeRepository.create(envelope);

      // Calculate sourceSha256 if sourceKey is provided
      if (data.sourceKey) {
        try {
          const sourceDocumentContent = await this.s3Service.getDocumentContent(data.sourceKey);
          const sourceHash = sha256Hex(sourceDocumentContent);
          
          // Update envelope with source hash
          await this.updateHashes(
            data.id,
            { sourceSha256: sourceHash },
            userId
          );
        } catch (error) {
          // Log error but don't fail envelope creation if source hash calculation fails
          console.warn(`Failed to calculate sourceSha256 for envelope ${data.id.getValue()}:`, error);
        }
      }

      // Create audit event (envelope-level event, no signerId required)
      await this.signatureAuditEventService.createEvent({
        envelopeId: data.id.getValue(),
        signerId: undefined, // No signerId for envelope creation events
        eventType: AuditEventType.ENVELOPE_CREATED,
        description: `Envelope "${data.title}" created`,
        userId: userId,
        userEmail: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined,
        metadata: {
          envelopeId: data.id.getValue(),
          title: data.title,
          signingOrder: data.signingOrder.toString(),
          originType: data.origin.getType(),
          expiresAt: data.expiresAt?.toISOString()
        }
      });

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
  async getEnvelopeWithSigners(
    envelopeId: EnvelopeId,
    securityContext?: {
      ipAddress: string;
      userAgent: string;
      country?: string;
    },
    invitationToken?: string
  ): Promise<SignatureEnvelope | null> {
    try {
      const envelopeWithSigners = await this.signatureEnvelopeRepository.getWithSigners(envelopeId);

      // Create audit event when an external user accesses the envelope successfully
      if (invitationToken && securityContext) {
        const token = await this.invitationTokenService.validateInvitationToken(invitationToken);

        // Only audit if token matches the envelope being accessed
        if (token.getEnvelopeId().getValue() === envelopeId.getValue()) {
          // Get signer information for audit
          const signer = envelopeWithSigners?.getSigners().find(s => 
            s.getId().getValue() === token.getSignerId().getValue()
          );
          
          // ✅ NO usar try-catch - si audit falla, la operación debe fallar
          await this.signatureAuditEventService.createEvent({
            envelopeId: envelopeId.getValue(),
            signerId: token.getSignerId().getValue(),
            eventType: AuditEventType.DOCUMENT_ACCESSED,
            description: 'External user accessed envelope document via invitation token',
            userId: signer?.getEmail()?.getValue() || 'external-user', // ✅ Use email as identifier for external users
            userEmail: signer?.getEmail()?.getValue(), // ✅ Use email real del signer
            ipAddress: securityContext.ipAddress,
            userAgent: securityContext.userAgent,
            country: securityContext.country,
            metadata: {
              accessType: AccessType.EXTERNAL,
              invitationTokenId: token.getId().getValue(),
              signerId: token.getSignerId().getValue(),
              signerEmail: signer?.getEmail()?.getValue(),
              signerFullName: signer?.getFullName(),
              externalUserIdentifier: `${signer?.getEmail()?.getValue()}_${signer?.getFullName()}`, // ✅ Unique identifier for external users
              accessTimestamp: new Date().toISOString()
            }
          });
        }
      }

      return envelopeWithSigners;
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
   * Updates a signature envelope with comprehensive validation
   * @param envelopeId - The envelope ID
   * @param updateData - The update data
   * @param userId - The user making the request
   * @returns Updated envelope
   */
  async updateEnvelope(
    envelopeId: EnvelopeId,
    updateData: UpdateEnvelopeData,
    userId: string
  ): Promise<SignatureEnvelope> {
    try {
      // 1. Get current envelope with signers
      const envelope = await this.signatureEnvelopeRepository.getWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }
      
      // 2. Validate update using domain rule (includes existence validation)
      EnvelopeUpdateValidationRule.validateEnvelopeUpdate(
        envelope,
        updateData,
        userId,
        envelope.getSigners()
      );
      
      // 3. Check for signing order auto-correction when adding signers
      let correctedSigningOrder: SigningOrderType | null = null;
      if (updateData.addSigners && updateData.addSigners.length > 0) {
        // Create temporary signers data for validation
        const allSignersData = [
          ...envelope.getSigners().map(signer => ({
            envelopeId: envelope.getId(),
            userId: signer.getUserId() || undefined,
            email: signer.getEmail()?.getValue() || '',
            fullName: signer.getFullName() || '',
            isExternal: signer.getIsExternal(),
            order: signer.getOrder(),
            participantRole: 'SIGNER' as const
          })),
          ...updateData.addSigners.map(signer => ({
            envelopeId: envelope.getId(),
            userId: signer.userId || undefined,
            email: signer.email,
            fullName: signer.fullName,
            isExternal: signer.isExternal,
            order: signer.order || 1,
            participantRole: 'SIGNER' as const
          }))
        ];
        
        // Check if auto-correction is needed
        correctedSigningOrder = envelope.validateSigningOrderConsistency(allSignersData);
        
        if (correctedSigningOrder) {
          console.log(`🔧 Auto-correcting signing order from ${envelope.getSigningOrder().getType()} to ${correctedSigningOrder}`);
          // Update the envelope directly with the corrected signing order
          const newSigningOrder = new SigningOrder(correctedSigningOrder);
          envelope.updateSigningOrder(newSigningOrder);
        }
      }
      
      // 4. Apply updates to entity using entity methods
      if (updateData.title) {
        envelope.updateTitle(updateData.title);
      }
      if (updateData.description !== undefined) {
        envelope.updateDescription(updateData.description);
      }
      if (updateData.expiresAt !== undefined) {
        envelope.updateExpiresAt(updateData.expiresAt);
      }
      if (updateData.signingOrderType) {
        envelope.updateSigningOrder(SigningOrder.fromString(updateData.signingOrderType));
      }
      if (updateData.sourceKey) {
        envelope.updateSourceKey(S3Key.fromString(updateData.sourceKey));
      }
      if (updateData.metaKey) {
        envelope.updateMetaKey(S3Key.fromString(updateData.metaKey));
      }
      
      // 4. Save updated envelope
      const updatedEnvelope = await this.signatureEnvelopeRepository.update(envelopeId, envelope);
      
      // 5. Create audit event
      await this.signatureAuditEventService.createEvent({
        envelopeId: envelopeId.getValue(),
        signerId: undefined,
        eventType: AuditEventType.ENVELOPE_UPDATED,
        description: `Envelope "${envelope.getTitle()}" updated`,
        userId: userId,
        userEmail: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined,
        metadata: {
          updatedFields: Object.keys(updateData),
          envelopeId: envelopeId.getValue()
        }
      });
      
      return updatedEnvelope;
    } catch (error) {
      wrapServiceError(error as Error, 'update envelope');
    }
  }

  /**
   * Cancels a signature envelope (changes status to CANCELLED)
   * @param envelopeId - The envelope ID
   * @param userId - The user cancelling the envelope
   * @returns The cancelled envelope
   */
  async cancelEnvelope(envelopeId: EnvelopeId, userId: string): Promise<SignatureEnvelope> {
    try {
      // Get existing envelope
      const existingEnvelope = await this.signatureEnvelopeRepository.findById(envelopeId);
      if (!existingEnvelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // Cancel envelope using entity method (includes authorization and validation)
      existingEnvelope.cancel(userId);
      const cancelledEnvelope = await this.signatureEnvelopeRepository.update(envelopeId, existingEnvelope);

      // Create audit event
      await this.signatureAuditEventService.createEvent({
        envelopeId: envelopeId.getValue(),
        signerId: undefined,
        eventType: AuditEventType.ENVELOPE_CANCELLED,
        description: `Envelope "${existingEnvelope.getTitle()}" cancelled`,
        userId: userId,
        userEmail: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined,
        metadata: {
          envelopeId: envelopeId.getValue(),
          title: existingEnvelope.getTitle(),
          cancelledAt: cancelledEnvelope.getUpdatedAt().toISOString()
        }
      });

      return cancelledEnvelope;
    } catch (error) {
      // Re-throw business validation errors directly (they have correct HTTP status codes)
      // Check for specific error types from signature-errors
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (errorCode === 'ENVELOPE_ACCESS_DENIED' || 
            errorCode === 'ENVELOPE_COMPLETED' || 
            errorCode === 'ENVELOPE_EXPIRED' || 
            errorCode === 'ENVELOPE_DECLINED' || 
            errorCode === 'INVALID_ENVELOPE_STATE') {
          throw error;
        }
      }
      
      // Only wrap unexpected errors
      throw envelopeUpdateFailed(
        `Failed to cancel envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
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
        existingEnvelope.getCreatedBy(),
        AuditEventType.ENVELOPE_DELETED,
        `Envelope "${existingEnvelope.getTitle()}" deleted`,
        userId,
        undefined,
        undefined,
        undefined,
        undefined, // country
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
        updatedEnvelope.getCreatedBy(),
        AuditEventType.ENVELOPE_UPDATED,
        `S3 keys updated for envelope "${updatedEnvelope.getTitle()}"`,
        userId,
        undefined,
        undefined,
        undefined,
        undefined, // country
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
  async updateHashes(envelopeId: EnvelopeId, hashes: Hashes, userId?: string): Promise<SignatureEnvelope> {
    try {
      const updatedEnvelope = await this.signatureEnvelopeRepository.updateHashes(envelopeId, hashes);

      // Create audit event if userId provided
      if (userId) {
        await this.signatureAuditEventService.createEvent({
          envelopeId: envelopeId.getValue(),
          signerId: undefined, // No signerId for envelope-level events
          eventType: AuditEventType.ENVELOPE_UPDATED,
          description: `Document hashes updated for envelope "${updatedEnvelope.getTitle()}"`,
          userId: userId,
          userEmail: undefined,
          ipAddress: undefined,
          userAgent: undefined,
          country: undefined,
          metadata: {
            envelopeId: envelopeId.getValue(),
            hashes: hashes
          }
        });
      }

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
   * @param signerId - The ID of the signer who signed the document
   * @param userId - The user making the update
   * @returns The updated signature envelope
   */
  async updateSignedDocument(envelopeId: EnvelopeId, signedKey: string, signedSha256: string, signerId: string, userId: string): Promise<SignatureEnvelope> {
    try {
      const updatedEnvelope = await this.signatureEnvelopeRepository.updateSignedDocument(envelopeId, signedKey, signedSha256);

      // Create audit event
      await this.signatureAuditEventService.createSignerAuditEvent(
        envelopeId.getValue(),
        signerId,
        AuditEventType.ENVELOPE_UPDATED,
        `Signed document updated for envelope "${updatedEnvelope.getTitle()}"`,
        userId,
        undefined,
        undefined,
        undefined,
        undefined, // country
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
      if (envelope.getCreatedBy() !== userId) {
        throw envelopeAccessDenied(`User ${userId} does not have access to envelope ${envelopeId.getValue()}`);
      }

      return envelope;
    } catch (error) {
      // Preserve specific error types (404, 403, etc.)
      if (error instanceof Error && (
        error.message.includes('access') || 
        error.message.includes('not found') ||
        error.message.includes('Envelope with ID')
      )) {
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
      // Preserve original token validation errors (401 Unauthorized)
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (errorCode === 'INVITATION_TOKEN_INVALID' || 
            errorCode === 'INVITATION_TOKEN_EXPIRED' ||
            errorCode === 'INVITATION_TOKEN_ALREADY_USED' ||
            errorCode === 'INVITATION_TOKEN_REVOKED') {
          throw error; // Preserve original 401/409 errors
        }
      }
      
      // Only wrap non-token errors in envelopeAccessDenied (403)
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

  /**
   * Updates the signing order of an envelope with automatic reordering
   * @param envelopeId - The envelope ID
   * @param newSigningOrderType - The new signing order type
   * @param userId - The user making the request
   * @returns Updated envelope
   */
  async updateSigningOrder(
    envelopeId: EnvelopeId,
    newSigningOrderType: string,
    userId: string
  ): Promise<SignatureEnvelope> {
    try {
      // 1. Get current envelope with signers
      const envelope = await this.signatureEnvelopeRepository.getWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }
      
      // 2. Validate access
      if (envelope.getCreatedBy() !== userId) {
        throw envelopeAccessDenied(`Only the envelope owner can modify envelope ${envelopeId.getValue()}`);
      }
      
      // 3. Get current signers
      const existingSigners = envelope.getSigners();
      
      // 4. Validate change is possible
      envelope.validateSigningOrderChange(newSigningOrderType, existingSigners);
      
      // 5. Update signing order in envelope
      envelope.updateSigningOrder(SigningOrder.fromString(newSigningOrderType));
      
      // 6. Save updated envelope
      const updatedEnvelope = await this.signatureEnvelopeRepository.update(envelopeId, envelope);
      
      // 7. Create audit event
      await this.signatureAuditEventService.createEvent({
        envelopeId: envelopeId.getValue(),
        signerId: undefined,
        eventType: AuditEventType.ENVELOPE_UPDATED,
        description: `Signing order changed to ${newSigningOrderType}`,
        userId: userId,
        userEmail: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined,
        metadata: {
          newSigningOrderType,
          envelopeId: envelopeId.getValue()
        }
      });
      
      return updatedEnvelope;
    } catch (error) {
      wrapServiceError(error as Error, 'update signing order');
    }
  }

  /**
   * Sends an envelope by validating state and changing to READY_FOR_SIGNATURE
   * @param envelopeId - The envelope ID to send
   * @param userId - The user making the request
   * @returns Updated signature envelope
   */
  async sendEnvelope(envelopeId: EnvelopeId, userId: string): Promise<SignatureEnvelope> {
    try {
      // 1. Get envelope with signers
      const envelope = await this.signatureEnvelopeRepository.getWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }
      
      // 2. Validate access (only the creator can send)
      if (envelope.getCreatedBy() !== userId) {
        throw envelopeAccessDenied('Only envelope owner can send envelope');
      }
      
      // 3. Validate state (not in final state)
      if (envelope.isInFinalState()) {
        throw invalidEnvelopeState('Cannot send envelope in final state');
      }
      
      // 4. Validate that has external signers
      if (!envelope.hasExternalSigners()) {
        throw invalidEnvelopeState('Envelope must have at least one external signer');
      }
      
      // 5. Validate that external signers have email and full name
      envelope.validateExternalSigners();
      
      // 6. Change status to READY_FOR_SIGNATURE (only if was in DRAFT)
      if (envelope.getStatus().isDraft()) {
        envelope.send(); // Changes to READY_FOR_SIGNATURE
        const updatedEnvelope = await this.signatureEnvelopeRepository.update(envelopeId, envelope);
        return updatedEnvelope;
      }
      
      // 7. If already in READY_FOR_SIGNATURE, return as-is
      return envelope;
    } catch (error) {
      wrapServiceError(error as Error, 'send envelope');
    }
  }

  /**
   * Completes an envelope when all signers have signed
   * @param envelopeId - The envelope ID to complete
   * @param userId - The user making the request
   * @returns Updated signature envelope
   */
  async completeEnvelope(envelopeId: EnvelopeId, userId: string): Promise<SignatureEnvelope> {
    try {
      // Complete envelope using repository method (which uses entity method)
      const updatedEnvelope = await this.signatureEnvelopeRepository.completeEnvelope(envelopeId);

      // Create audit event
      await this.signatureAuditEventService.createEvent({
        envelopeId: envelopeId.getValue(),
        signerId: undefined,
        eventType: AuditEventType.ENVELOPE_COMPLETED,
        description: `Envelope "${updatedEnvelope.getTitle()}" completed - all signers have signed`,
        userId: userId,
        userEmail: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined,
        metadata: {
          envelopeId: envelopeId.getValue(),
          completedAt: updatedEnvelope.getCompletedAt()?.toISOString()
        }
      });

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to complete envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }


  /**
   * Updates flattened key for an envelope
   * @param envelopeId - The envelope ID
   * @param flattenedKey - The flattened document S3 key
   * @param userId - The user making the update
   * @returns The updated signature envelope
   */
  async updateFlattenedKey(
    envelopeId: EnvelopeId,
    flattenedKey: string,
    userId?: string
  ): Promise<SignatureEnvelope> {
    try {
      const updatedEnvelope = await this.signatureEnvelopeRepository.updateFlattenedKey(
        envelopeId,
        flattenedKey
      );

      // Create audit event if userId provided
      if (userId) {
        await this.signatureAuditEventService.createEvent({
          envelopeId: envelopeId.getValue(),
          signerId: undefined,
          eventType: AuditEventType.ENVELOPE_UPDATED,
          description: `Flattened key updated for envelope "${updatedEnvelope.getTitle()}"`,
          userId: userId,
          userEmail: undefined,
          ipAddress: undefined,
          userAgent: undefined,
          country: undefined,
          metadata: {
            envelopeId: envelopeId.getValue(),
            flattenedKey: flattenedKey
          }
        });
      }

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to update flattened key for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Updates envelope status to DECLINED after a signer declines
   * @param envelopeId - The envelope ID
   * @param declinedBySignerId - ID of the signer who declined
   * @param declineReason - Reason for declining
   * @param userId - The user ID (optional for external users)
   * @returns Updated envelope
   */
  async updateEnvelopeStatusAfterDecline(
    envelopeId: EnvelopeId,
    declinedBySignerId: SignerId,
    declineReason: string,
    userId?: string
  ): Promise<SignatureEnvelope> {
    try {
      // Get envelope with signers
      const envelope = await this.getEnvelopeWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // Set decline-specific fields and update envelope status to DECLINED
      envelope.setDeclinedInfo(declinedBySignerId.getValue(), declineReason);

      // Update in repository
      const updatedEnvelope = await this.signatureEnvelopeRepository.update(envelopeId, envelope);

      // Create audit event if userId provided
      if (userId) {
        await this.signatureAuditEventService.createEvent({
          envelopeId: envelopeId.getValue(),
          signerId: declinedBySignerId.getValue(),
          eventType: AuditEventType.ENVELOPE_DECLINED,
          description: `Envelope declined by signer ${declinedBySignerId.getValue()}`,
          userId: userId,
          userEmail: undefined,
          ipAddress: undefined,
          userAgent: undefined,
          country: undefined,
          metadata: {
            envelopeId: envelopeId.getValue(),
            declinedBySignerId: declinedBySignerId.getValue(),
            declineReason: declineReason,
            declinedAt: updatedEnvelope.getDeclinedAt()?.toISOString()
          }
        });
      }

      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to update envelope status after decline for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }
}
