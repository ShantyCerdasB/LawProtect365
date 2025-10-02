/**
 * @fileoverview EnvelopeCrudService - CRUD operations for signature envelopes
 * @summary Service for basic envelope CRUD operations (Create, Read, Update, Delete)
 * @description This service encapsulates all basic CRUD operations for signature envelopes including
 * creation, retrieval, updates, cancellation, and listing with proper audit logging and validation.
 */

import { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SigningOrder } from '@/domain/value-objects/SigningOrder';
import { SignatureEnvelopeRepository } from '@/repositories/SignatureEnvelopeRepository';
import { InvitationTokenService } from '@/services/invitationTokenService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { S3Key, Email } from '@lawprotect/shared-ts';
import { createDocumentAccessedAudit } from '@/services/orchestrators/utils/audit/envelopeAuditHelpers';
import { EntityFactory } from '@/infrastructure/factories/EntityFactory';
import { EnvelopeUpdateValidationRule, UpdateEnvelopeData } from '@/domain/rules/EnvelopeUpdateValidationRule';
import { EnvelopeSpec, CreateEnvelopeData } from '@/domain/types/envelope';
import { SigningOrderType } from '@prisma/client';
import { 
  envelopeNotFound,
  envelopeCreationFailed,
  envelopeUpdateFailed,
} from '@/signature-errors';

/**
 * Service for managing envelope CRUD operations
 * Handles creation, retrieval, updates, cancellation, and listing of signature envelopes
 */
export class EnvelopeCrudService {
  constructor(
    private readonly signatureEnvelopeRepository: SignatureEnvelopeRepository,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly auditEventService: AuditEventService
  ) {}

  /**
   * Creates a new signature envelope
   * @param data - The envelope creation data
   * @param userId - The user creating the envelope
   * @returns The created signature envelope
   */
  async createEnvelope(data: CreateEnvelopeData): Promise<SignatureEnvelope> {
    try {
      // Create envelope entity using EntityFactory
      const envelope = EntityFactory.createSignatureEnvelope(data);

      // Save to repository
      const createdEnvelope = await this.signatureEnvelopeRepository.create(envelope);


      return createdEnvelope;
    } catch (error) {
      throw envelopeCreationFailed(
        `Failed to create envelope: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets a signature envelope with all signers
   * @param envelopeId - The envelope ID
   * @param securityContext - Security context for audit tracking
   * @param invitationToken - Invitation token for external users
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
        if (token.getEnvelopeId().getValue() === envelopeId.getValue() && envelopeWithSigners) {
          const signer = envelopeWithSigners.getSigners().find(s => 
            s.getId().equals(token.getSignerId())
          );
          
          if (signer) {
            const externalUserId = signer.getId().getValue();
            const signerEmail = signer.getEmail()?.getValue();
            
            const auditData = createDocumentAccessedAudit(
              envelopeId.getValue(),
              signer.getId().getValue(),
              externalUserId,
              signerEmail ? Email.fromString(signerEmail) : undefined,
              securityContext
            );
            
            await this.auditEventService.create(auditData);
          }
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
   * Updates a signature envelope with validation and audit logging
   * @param envelopeId - The envelope ID
   * @param updateData - The update data
   * @param userId - The user making the update
   * @returns The updated signature envelope
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
        
        if (correctedSigningOrder) {      // Update the envelope directly with the corrected signing order
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
      
      
      return updatedEnvelope;
    } catch (error) {
      throw envelopeUpdateFailed(
        `Failed to update envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
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
}