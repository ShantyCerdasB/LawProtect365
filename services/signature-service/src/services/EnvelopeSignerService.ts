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
import { NetworkSecurityContext } from '@lawprotect/shared-ts';
import { 
  signerNotFound,
  signerCreationFailed,
  signerUpdateFailed,
  signerAlreadySigned,
  signerEmailDuplicate,
  envelopeNotFound
} from '../signature-errors';
import { ConflictError, BadRequestError, NotFoundError, wrapServiceError } from '@lawprotect/shared-ts';

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
   * @param config - Audit event configuration
   */
  private async createSignerAuditEvent(config: {
    envelopeId: string;
    signerId: string;
    eventType: AuditEventType;
    description: string;
    userId: string;
    userEmail?: string;
    metadata?: Record<string, unknown>;
  } & NetworkSecurityContext): Promise<void> {
    await this.signatureAuditEventService.createSignerAuditEvent({
      envelopeId: config.envelopeId,
      signerId: config.signerId,
      eventType: config.eventType,
      description: config.description,
      userId: config.userId,
      userEmail: config.userEmail,
      ipAddress: config.ipAddress,
      userAgent: config.userAgent,
      country: config.country,
      metadata: config.metadata
    });
  }

  /**
   * Creates a viewer participant for an envelope (read-only access)
   * @param envelopeId - The envelope ID
   * @param email - Email address of the viewer
   * @param fullName - Full name of the viewer
   * @param userId - The user creating the viewer
   * @returns Created viewer participant
   */
  async createViewerParticipant(
    envelopeId: EnvelopeId,
    email: string,
    fullName: string,
    userId: string
  ): Promise<EnvelopeSigner> {
    try {
      // Validate envelope exists
      const envelope = await this.signatureEnvelopeRepository.findById(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // Get existing signers for validation
      const existingSigners = await this.envelopeSignerRepository.findByEnvelopeId(envelopeId);
      
      // Validate that viewer doesn't already exist (using envelope entity validation)
      envelope.validateViewerNotExists(email, existingSigners);

      // Create viewer participant data
      const viewerData: CreateSignerData = {
        envelopeId,
        email,
        fullName,
        isExternal: true,
        participantRole: 'VIEWER',
        order: 999, // High order number to place viewers at the end
        invitedByUserId: userId
      };

      // Create viewer entity
      const viewer = EntityFactory.createEnvelopeSigner(viewerData);

      // Save to repository
      const createdViewer = await this.envelopeSignerRepository.create(viewer);

      // Create audit event
      await this.signatureAuditEventService.createSignerAuditEvent({
        envelopeId: envelopeId.getValue(),
        signerId: createdViewer.getId().getValue(),
        eventType: AuditEventType.SIGNATURE_CREATED,
        description: `Viewer participant created: ${fullName} (${email})`,
        userId: userId,
        userEmail: email,
        metadata: {
          participantRole: 'VIEWER',
          viewerEmail: email,
          viewerName: fullName,
          envelopeId: envelopeId.getValue()
        }
      });

      return createdViewer;
    } catch (error) {
      // Re-throw the original error if it's already an AppError
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw signerCreationFailed(
        `Failed to create viewer participant: ${error instanceof Error ? error.message : error}`
      );
    }
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
        // ✅ External users tracking: verificar si ya existe el mismo email+fullName
        if (signerData.isExternal && signerData.email && signerData.fullName) {
          const existingSigner = await this.findExistingExternalSigner(
            signerData.email,
            signerData.fullName
          );
          
          if (existingSigner) {
            // ✅ External users siempre tienen userId = null, no reutilizamos userId
            // El tracking se hace por email + fullName, no por userId
            console.log(`External user ${signerData.email} (${signerData.fullName}) already exists in system`);
          }
        }
        
        const signer = await this.createSigner(signerData);
        createdSigners.push(signer);
      }

      // Create audit events for all signers
      for (const signer of createdSigners) {
        await this.createSignerAuditEvent({
          envelopeId: envelopeId.getValue(),
          signerId: signer.getId().getValue(),
          eventType: AuditEventType.SIGNER_ADDED,
          description: `Signer ${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'} added to envelope`,
          userId: envelope.getCreatedBy(),
          userEmail: signer.getEmail()?.getValue(),
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
      wrapServiceError(error as Error, `create signers for envelope ${envelopeId.getValue()}`);
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
      const savedSigner = await this.envelopeSignerRepository.create(signer);
      
      return savedSigner;
    } catch (error) {
      throw signerCreationFailed(
        `Failed to create signer: ${error instanceof Error ? error.message : error}`
      );
    }
  }


  /**
   * Finds existing external signer by email and fullName across all envelopes
   * @param email - Signer email
   * @param fullName - Signer full name
   * @returns Existing signer or null
   */
  async findExistingExternalSigner(email: string, fullName: string): Promise<EnvelopeSigner | null> {
    try {
      const signers = await this.envelopeSignerRepository.list({
        email: email.toLowerCase(),
        isExternal: true
      });
      
      // ✅ Validar por AMBOS email Y fullName (case-insensitive)
      const existingSigner = signers.items.find(signer => 
        signer.getEmail()?.getValue().toLowerCase() === email.toLowerCase() &&
        signer.getFullName()?.toLowerCase() === fullName.toLowerCase()
      );
      
      return existingSigner || null;
    } catch (error) {
      throw signerNotFound(
        `Failed to find existing external signer: ${error instanceof Error ? error.message : error}`
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
      wrapServiceError(error as Error, `delete signer ${signerId.getValue()}`);
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

      // Record consent if consentText is provided
      if (signatureData.consentText && signatureData.ipAddress && signatureData.userAgent) {
        signer.recordConsent(
          signatureData.consentText,
          signatureData.ipAddress,
          signatureData.userAgent
        );
      }

      // Create signature metadata
      const metadata = new SignatureMetadata(
        signatureData.reason,
        signatureData.location,
        signatureData.ipAddress,
        signatureData.userAgent
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
      await this.createSignerAuditEvent({
        envelopeId: signer.getEnvelopeId().getValue(),
        signerId: signerId.getValue(),
        eventType: AuditEventType.SIGNER_SIGNED,
        description: `Signer ${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'} signed the document`,
        userId: signer.getUserId() || `external-user:${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'}`,
        userEmail: signer.getEmail()?.getValue(),
        ipAddress: signatureData.ipAddress,
        userAgent: signatureData.userAgent,
        country: signatureData.location,
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
      signer.decline(declineData.reason, declineData.ipAddress, declineData.userAgent, declineData.country);

      // Update in repository
      const updatedSigner = await this.envelopeSignerRepository.update(declineData.signerId, signer);

      // Create audit event
      await this.createSignerAuditEvent({
        envelopeId: signer.getEnvelopeId().getValue(),
        signerId: declineData.signerId.getValue(),
        eventType: AuditEventType.SIGNER_DECLINED,
        description: `Signer ${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'} declined to sign`,
        userId: declineData.userId || `external-user:${signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown'}`,
        userEmail: signer.getEmail()?.getValue(),
        ipAddress: declineData.ipAddress,
        userAgent: declineData.userAgent,
        country: declineData.country,
        metadata: {
          declineReason: declineData.reason,
          declinedAt: updatedSigner.getDeclinedAt()?.toISOString()
        }
      });

      return updatedSigner;
    } catch (error) {
      // Only wrap technical errors, not business validation errors
      if (error instanceof ConflictError || error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error; // Re-throw business errors as-is
      }
      
      // Only wrap unexpected technical errors
      throw signerUpdateFailed(
        `Failed to decline signer: ${error instanceof Error ? error.message : error}`
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
