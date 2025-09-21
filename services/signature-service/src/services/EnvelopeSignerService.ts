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
import { Email } from '../domain/value-objects/Email';
import { SignatureMetadata } from '../domain/value-objects/SignatureMetadata';
import { SignerStatus, SigningOrderType } from '@prisma/client';
import { EnvelopeSignerRepository } from '../repositories/EnvelopeSignerRepository';
import { SignatureEnvelopeRepository } from '../repositories/SignatureEnvelopeRepository';
import { SignatureAuditEventService } from './SignatureAuditEventService';
import { InvitationTokenService } from './InvitationTokenService';
import { 
  CreateSignerData, 
  DeclineSignerData, 
  ConsentData, 
  SignatureData 
} from '../domain/types/signer';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { 
  signerNotFound,
  signerCreationFailed,
  signerUpdateFailed,
  signerDeleteFailed,
  signerAccessDenied,
  signerSigningOrderViolation,
  signerAlreadySigned,
  signerAlreadyDeclined,
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
    private readonly signatureAuditEventService: SignatureAuditEventService,
    private readonly invitationTokenService: InvitationTokenService
  ) {}

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
        await this.signatureAuditEventService.createEvent({
          envelopeId: envelopeId.getValue(),
          signerId: signer.getId().getValue(),
          eventType: AuditEventType.SIGNER_ADDED,
          description: `Signer ${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'} added to envelope`,
          userId: envelope.getCreatedBy().getValue(),
          userEmail: signer.getEmail()?.getValue(),
          ipAddress: undefined,
          userAgent: undefined,
          country: undefined,
          metadata: {
            signerId: signer.getId().getValue(),
            isExternal: signer.getIsExternal(),
            order: signer.getOrder(),
            participantRole: signer.getParticipantRole()
          }
        });
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

      // Create signer entity
      const signer = new EnvelopeSigner(
        SignerId.generate(),
        signerData.envelopeId,
        signerData.userId,
        signerData.isExternal,
        signerData.email ? Email.fromString(signerData.email) : undefined,
        signerData.fullName,
        signerData.invitedByUserId,
        signerData.participantRole,
        signerData.order,
        SignerStatus.PENDING,
        undefined, // signedAt
        undefined, // declinedAt
        undefined, // declineReason
        undefined, // consentGiven
        undefined, // consentTimestamp
        undefined, // documentHash
        undefined, // signatureHash
        undefined, // signedS3Key
        undefined, // kmsKeyId
        undefined, // algorithm
        undefined, // ipAddress
        undefined, // userAgent
        undefined, // reason
        undefined, // location
        new Date(), // createdAt
        new Date()  // updatedAt
      );

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

      // Get current signer
      const currentSigner = await this.envelopeSignerRepository.findById(signerId);
      if (!currentSigner) {
        throw signerNotFound(`Signer with ID ${signerId.getValue()} not found`);
      }

      // Get all signers for this envelope
      const allSigners = await this.envelopeSignerRepository.findByEnvelopeId(envelopeId);
      
      // Sort signers by order
      const sortedSigners = allSigners.sort((a, b) => a.getOrder() - b.getOrder());

      // Validate signing order based on envelope's signing order type
      const signingOrderType = envelope.getSigningOrder().getType();
      
      if (signingOrderType === SigningOrderType.OWNER_FIRST) {
        await this.validateOwnerFirstOrder(sortedSigners, currentSigner, userId);
      } else if (signingOrderType === SigningOrderType.INVITEES_FIRST) {
        await this.validateInviteesFirstOrder(sortedSigners, currentSigner, userId);
      }
    } catch (error) {
      throw signerSigningOrderViolation(
        `Signing order validation failed: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Validates owner-first signing order
   * @param sortedSigners - Signers sorted by order
   * @param currentSigner - The signer attempting to sign
   * @param userId - The user ID
   */
  private async validateOwnerFirstOrder(
    sortedSigners: EnvelopeSigner[], 
    currentSigner: EnvelopeSigner, 
    userId: string
  ): Promise<void> {
    // Find owner (signer with userId matching envelope creator)
    const owner = sortedSigners.find(signer => signer.getUserId() === userId);
    
    if (owner && owner.getId().equals(currentSigner.getId())) {
      // Owner can sign first
      return;
    }

    // Check if owner has signed
    if (owner && !owner.hasSigned()) {
      throw signerSigningOrderViolation('Owner must sign first');
    }

    // For non-owner signers, they can sign after owner
    if (!owner || owner.hasSigned()) {
      return;
    }
  }

  /**
   * Validates invitees-first signing order
   * @param sortedSigners - Signers sorted by order
   * @param currentSigner - The signer attempting to sign
   * @param userId - The user ID
   */
  private async validateInviteesFirstOrder(
    sortedSigners: EnvelopeSigner[], 
    currentSigner: EnvelopeSigner, 
    userId: string
  ): Promise<void> {
    // Find owner (signer with userId matching envelope creator)
    const owner = sortedSigners.find(signer => signer.getUserId() === userId);
    
    if (owner && owner.getId().equals(currentSigner.getId())) {
      // Owner can only sign after all invitees have signed
      const invitees = sortedSigners.filter(signer => signer.getIsExternal());
      const allInviteesSigned = invitees.every(signer => signer.hasSigned());
      
      if (!allInviteesSigned) {
        throw signerSigningOrderViolation('All invitees must sign before owner');
      }
      return;
    }

    // For invitees, they can sign in any order
    return;
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
      await this.signatureAuditEventService.createEvent({
        envelopeId: signer.getEnvelopeId().getValue(),
        signerId: signerId.getValue(),
        eventType: AuditEventType.SIGNER_SIGNED,
        description: `Signer ${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'} signed the document`,
        userId: signer.getUserId() || 'external-user',
        userEmail: signer.getEmail()?.getValue(),
        ipAddress: signatureData.ipAddress,
        userAgent: signatureData.userAgent,
        country: undefined,
        metadata: {
          signatureHash: signatureData.signatureHash,
          documentHash: signatureData.documentHash,
          signedS3Key: signatureData.signedS3Key,
          kmsKeyId: signatureData.kmsKeyId,
          algorithm: signatureData.algorithm,
          reason: signatureData.reason,
          location: signatureData.location
        }
      });

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
      await this.signatureAuditEventService.createEvent({
        envelopeId: signer.getEnvelopeId().getValue(),
        signerId: declineData.signerId.getValue(),
        eventType: AuditEventType.SIGNER_DECLINED,
        description: `Signer ${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'} declined to sign`,
        userId: declineData.userId,
        userEmail: signer.getEmail()?.getValue(),
        ipAddress: undefined,
        userAgent: undefined,
        country: undefined,
        metadata: {
          declineReason: declineData.reason,
          declinedAt: updatedSigner.getDeclinedAt()?.toISOString()
        }
      });

      return updatedSigner;
    } catch (error) {
      throw signerUpdateFailed(
        `Failed to decline signer: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Records signer consent
   * @param signerId - The signer ID
   * @param consentData - The consent data
   * @returns Updated signer
   */
  async recordSignerConsent(signerId: SignerId, consentData: ConsentData): Promise<EnvelopeSigner> {
    try {
      const signer = await this.envelopeSignerRepository.findById(signerId);
      if (!signer) {
        throw signerNotFound(`Signer with ID ${signerId.getValue()} not found`);
      }

      // Use entity method to record consent
      signer.recordConsent(consentData.consentText, consentData.ipAddress, consentData.userAgent);

      // Update in repository
      return await this.envelopeSignerRepository.update(signerId, signer);
    } catch (error) {
      throw signerUpdateFailed(
        `Failed to record signer consent: ${error instanceof Error ? error.message : error}`
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
        await this.signatureAuditEventService.createEvent({
          envelopeId: envelopeId.getValue(),
          signerId: signer.getId().getValue(),
          eventType: AuditEventType.SIGNER_REMINDER_SENT,
          description: `Reminder sent to signer ${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'}`,
          userId: 'system',
          userEmail: signer.getEmail()?.getValue(),
          ipAddress: undefined,
          userAgent: undefined,
          country: undefined,
          metadata: {
            signerEmail: signer.getEmail()?.getValue(),
            signerFullName: signer.getFullName()
          }
        });
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
    const emails = signersData
      .filter(signer => signer.email)
      .map(signer => signer.email!.toLowerCase());

    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      throw signerEmailDuplicate('Duplicate email addresses found in signer data');
    }

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
