/**
 * @fileoverview EnvelopeSignerService - Business logic service for envelope signer operations
 * @summary Provides business logic for signer management using new architecture
 * @description This service handles all business logic for envelope signer operations
 * including creation, validation, status management, and coordination with other services using
 * the new Prisma-based architecture with proper separation of concerns.
 */

import { EnvelopeSigner } from '../domain/entities/EnvelopeSigner';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignatureMetadata } from '../domain/value-objects/SignatureMetadata';
import { EntityFactory } from '../domain/factories/EntityFactory';
import { SignerStatus } from '@prisma/client';
import { EnvelopeSignerRepository } from '../repositories/EnvelopeSignerRepository';
import { SignatureEnvelopeRepository } from '../repositories/SignatureEnvelopeRepository';
import { SignatureAuditEventService } from './SignatureAuditEventService';
import { 
  CreateSignerData, 
  DeclineSignerData, 
  SignatureData 
} from '../domain/types/signer';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { 
  signerNotFound,
  signerCreationFailed,
  signerUpdateFailed,
  signerDeleteFailed,
  signerSigningOrderViolation,
  signerAlreadySigned,
  signerEmailDuplicate,
  envelopeNotFound
} from '../signature-errors';

/**
 * EnvelopeSignerService implementation
 * 
 * Provides business logic for envelope signer operations including creation, validation,
 * status management, and coordination with other services. Uses the new Prisma-based architecture
 * with proper separation of concerns between entities, repositories, and services.
 */
export class EnvelopeSignerService {
  constructor(
    private readonly envelopeSignerRepository: EnvelopeSignerRepository,
    private readonly signatureEnvelopeRepository: SignatureEnvelopeRepository,
    private readonly signatureAuditEventService: SignatureAuditEventService
  ) {}

  /**
   * Creates audit event with common fields for signer operations
   * @param envelopeId - The envelope ID
   * @param signerId - The signer ID
   * @param eventType - The audit event type
   * @param description - The event description
   * @param userId - The user ID
   * @param userEmail - The user email
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user agent
   * @param metadata - Optional metadata
   */
  private async createSignerAuditEvent(
    envelopeId: string,
    signerId: string,
    eventType: AuditEventType,
    description: string,
    userId: string,
    userEmail?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.signatureAuditEventService.createSignerAuditEvent(
      envelopeId,
      signerId,
      eventType,
      description,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      metadata
    );
  }

  /**
   * Creates signers for an envelope
   * @param envelopeId - The envelope ID
   * @param signersData - Array of signer data to create
   * @returns Array of created signers
   */
  async createSignersForEnvelope(envelopeId: EnvelopeId, signersData: CreateSignerData[]): Promise<EnvelopeSigner[]> {
    try {
      // Validate envelope exists
      const envelope = await this.signatureEnvelopeRepository.findById(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // Validate no duplicate emails
      await this.validateNoDuplicateEmails(envelopeId, signersData);

      // Create signers with proper order assignment
      const createdSigners: EnvelopeSigner[] = [];
      for (const signerData of signersData) {
        const signer = await this.createSigner(signerData);
        createdSigners.push(signer);
      }

      // Create audit events for all signers
      for (const signer of createdSigners) {
        await this.createSignerAuditEvent(
          envelopeId.getValue(),
          signer.getId().getValue(),
          AuditEventType.SIGNER_ADDED,
          `Signer ${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'} added to envelope`,
          envelope.getCreatedBy(),
          signer.getEmail()?.getValue(),
          undefined,
          undefined,
          {
            signerId: signer.getId().getValue(),
            isExternal: signer.getIsExternal(),
            order: signer.getOrder(),
            participantRole: signer.getParticipantRole()
          }
        );
      }

      return createdSigners;
    } catch (error) {
      throw signerCreationFailed(
        `Failed to create signers for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Creates a single signer
   * @param signerData - The signer data
   * @returns Created signer
   */
  async createSigner(signerData: CreateSignerData): Promise<EnvelopeSigner> {
    try {
      // Validate envelope exists
      const envelope = await this.signatureEnvelopeRepository.findById(signerData.envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${signerData.envelopeId.getValue()} not found`);
      }

      // Create signer entity using EntityFactory
      const signer = EntityFactory.createEnvelopeSigner(signerData);

      // Save to repository
      return await this.envelopeSignerRepository.create(signer);
    } catch (error) {
      throw signerCreationFailed(
        `Failed to create signer: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets a signer by ID
   * @param signerId - The signer ID
   * @returns The signer or null if not found
   */
  async getSigner(signerId: SignerId): Promise<EnvelopeSigner | null> {
    try {
      return await this.envelopeSignerRepository.findById(signerId);
    } catch (error) {
      throw signerNotFound(
        `Failed to get signer ${signerId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets all signers for an envelope
   * @param envelopeId - The envelope ID
   * @returns Array of signers
   */
  async getSignersByEnvelope(envelopeId: EnvelopeId): Promise<EnvelopeSigner[]> {
    try {
      return await this.envelopeSignerRepository.findByEnvelopeId(envelopeId);
    } catch (error) {
      throw signerNotFound(
        `Failed to get signers for envelope ${envelopeId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets signers by user ID
   * @param userId - The user ID
   * @returns Array of signers
   */
  async getSignersByUserId(userId: string): Promise<EnvelopeSigner[]> {
    try {
      return await this.envelopeSignerRepository.findByUserId(userId);
    } catch (error) {
      throw signerNotFound(
        `Failed to get signers for user ${userId}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets signers by status
   * @param status - The signer status
   * @param envelopeId - Optional envelope ID to filter by
   * @returns Array of signers
   */
  async getSignersByStatus(status: SignerStatus, envelopeId?: EnvelopeId): Promise<EnvelopeSigner[]> {
    try {
      return await this.envelopeSignerRepository.findByStatus(status, envelopeId);
    } catch (error) {
      throw signerNotFound(
        `Failed to get signers with status ${status}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Updates a signer
   * @param signerId - The signer ID
   * @param updates - The updates to apply
   * @returns Updated signer
   */
  async updateSigner(signerId: SignerId, updates: Partial<EnvelopeSigner>): Promise<EnvelopeSigner> {
    try {
      const existingSigner = await this.envelopeSignerRepository.findById(signerId);
      if (!existingSigner) {
        throw signerNotFound(`Signer with ID ${signerId.getValue()} not found`);
      }

      return await this.envelopeSignerRepository.update(signerId, updates);
    } catch (error) {
      throw signerUpdateFailed(
        `Failed to update signer ${signerId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Deletes a signer
   * @param signerId - The signer ID
   */
  async deleteSigner(signerId: SignerId): Promise<void> {
    try {
      const existingSigner = await this.envelopeSignerRepository.findById(signerId);
      if (!existingSigner) {
        throw signerNotFound(`Signer with ID ${signerId.getValue()} not found`);
      }

      // Validate signer can be removed
      if (existingSigner.hasSigned()) {
        throw signerAlreadySigned('Cannot remove signer who has already signed');
      }

      await this.envelopeSignerRepository.delete(signerId);
    } catch (error) {
      throw signerDeleteFailed(
        `Failed to delete signer ${signerId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Validates signing order for a signer
   * @param envelopeId - The envelope ID
   * @param signerId - The signer ID
   * @param userId - The user ID
   */
  async validateSigningOrder(envelopeId: EnvelopeId, signerId: SignerId, userId: string): Promise<void> {
    try {
      // Get envelope with signers
      const envelope = await this.signatureEnvelopeRepository.getWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // Get all signers for this envelope
      const allSigners = await this.envelopeSignerRepository.findByEnvelopeId(envelopeId);
      
      // Use entity method to validate signing order
      envelope.validateSigningOrder(signerId, userId, allSigners);
    } catch (error) {
      throw signerSigningOrderViolation(
        `Signing order validation failed: ${error instanceof Error ? error.message : error}`
      );
    }
  }




  /**
   * Marks a signer as signed
   * @param signerId - The signer ID
   * @param signatureData - The signature data
   * @returns Updated signer
   */
  async markSignerAsSigned(signerId: SignerId, signatureData: SignatureData): Promise<EnvelopeSigner> {
    try {
      const signer = await this.envelopeSignerRepository.findById(signerId);
      if (!signer) {
        throw signerNotFound(`Signer with ID ${signerId.getValue()} not found`);
      }

      // Create signature metadata
      const metadata = new SignatureMetadata(
        signatureData.ipAddress,
        signatureData.userAgent,
        signatureData.reason,
        signatureData.location
      );

      // Use entity method to sign
      signer.sign(
        signatureData.documentHash,
        signatureData.signatureHash,
        signatureData.signedS3Key,
        signatureData.kmsKeyId,
        signatureData.algorithm,
        metadata
      );

      // Update in repository
      const updatedSigner = await this.envelopeSignerRepository.update(signerId, signer);

      // Create audit event
      await this.createSignerAuditEvent(
        signer.getEnvelopeId().getValue(),
        signerId.getValue(),
        AuditEventType.SIGNER_SIGNED,
        `Signer ${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'} signed the document`,
        signer.getUserId() || 'external-user',
        signer.getEmail()?.getValue(),
        signatureData.ipAddress,
        signatureData.userAgent,
        {
          signatureHash: signatureData.signatureHash,
          documentHash: signatureData.documentHash,
          signedS3Key: signatureData.signedS3Key,
          kmsKeyId: signatureData.kmsKeyId,
          algorithm: signatureData.algorithm,
          reason: signatureData.reason,
          location: signatureData.location
        }
      );

      return updatedSigner;
    } catch (error) {
      throw signerUpdateFailed(
        `Failed to mark signer as signed: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Declines a signer
   * @param declineData - The decline data
   * @returns Updated signer
   */
  async declineSigner(declineData: DeclineSignerData): Promise<EnvelopeSigner> {
    try {
      const signer = await this.envelopeSignerRepository.findById(declineData.signerId);
      if (!signer) {
        throw signerNotFound(`Signer with ID ${declineData.signerId.getValue()} not found`);
      }

      // Use entity method to decline
      signer.decline(declineData.reason);

      // Update in repository
      const updatedSigner = await this.envelopeSignerRepository.update(declineData.signerId, signer);

      // Create audit event
      await this.createSignerAuditEvent(
        signer.getEnvelopeId().getValue(),
        declineData.signerId.getValue(),
        AuditEventType.SIGNER_DECLINED,
        `Signer ${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'} declined to sign`,
        declineData.userId,
        signer.getEmail()?.getValue(),
        undefined,
        undefined,
        {
          declineReason: declineData.reason,
          declinedAt: updatedSigner.getDeclinedAt()?.toISOString()
        }
      );

      return updatedSigner;
    } catch (error) {
      throw signerUpdateFailed(
        `Failed to decline signer: ${error instanceof Error ? error.message : error}`
      );
    }
  }


  /**
   * Sends reminders to pending signers
   * @param envelopeId - The envelope ID
   * @param signerIds - Optional specific signer IDs to remind
   */
  async sendReminders(envelopeId: EnvelopeId, signerIds?: SignerId[]): Promise<void> {
    try {
      const pendingSigners = await this.getPendingSigners(envelopeId);
      
      const signersToRemind = signerIds 
        ? pendingSigners.filter(signer => signerIds.some(id => id.equals(signer.getId())))
        : pendingSigners;

      for (const signer of signersToRemind) {
        // Create audit event for reminder
        await this.createSignerAuditEvent(
          envelopeId.getValue(),
          signer.getId().getValue(),
          AuditEventType.SIGNER_REMINDER_SENT,
          `Reminder sent to signer ${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'}`,
          'system',
          signer.getEmail()?.getValue(),
          undefined,
          undefined,
          {
            signerEmail: signer.getEmail()?.getValue(),
            signerFullName: signer.getFullName()
          }
        );
      }
    } catch (error) {
      throw signerUpdateFailed(
        `Failed to send reminders: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets pending signers for an envelope
   * @param envelopeId - The envelope ID
   * @returns Array of pending signers
   */
  async getPendingSigners(envelopeId: EnvelopeId): Promise<EnvelopeSigner[]> {
    try {
      return await this.envelopeSignerRepository.findByStatus(SignerStatus.PENDING, envelopeId);
    } catch (error) {
      throw signerNotFound(
        `Failed to get pending signers: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Validates no duplicate emails in signer data
   * @param envelopeId - The envelope ID
   * @param signersData - Array of signer data
   */
  private async validateNoDuplicateEmails(envelopeId: EnvelopeId, signersData: CreateSignerData[]): Promise<void> {
    // Get envelope to use entity validation (envelope existence already validated in createSignersForEnvelope)
    const envelope = await this.signatureEnvelopeRepository.findById(envelopeId);

    // Use entity method to validate duplicate emails in new data
    envelope!.validateNoDuplicateEmails(signersData);

    // Check against existing signers
    for (const signerData of signersData) {
      if (signerData.email) {
        const exists = await this.envelopeSignerRepository.existsByEmail(signerData.email, envelopeId);
        if (exists) {
          throw signerEmailDuplicate(`Email ${signerData.email} already exists in envelope`);
        }
      }
    }
  }

}
