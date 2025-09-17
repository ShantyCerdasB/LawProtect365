/**
 * @fileoverview SignerService - Service for signer business logic orchestration
 * @summary Orchestrates signer operations and coordinates with other services
 * @description This service handles all signer-related business logic, including
 * creation, updates, status management, and coordination with signatures and events.
 */

import { Signer } from '../domain/entities/Signer';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { Email } from '../domain/value-objects/Email';
import { SignerStatus } from '../domain/enums/SignerStatus';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { SigningOrderType } from '../domain/enums/SigningOrder';
import { SignerRepository } from '../repositories/SignerRepository';
import { EnvelopeRepository } from '../repositories/EnvelopeRepository';
import { AuditService } from './AuditService';
import { SignerEventService } from './events/SignerEventService';
import { EnvelopeEventService } from './events/EnvelopeEventService';
import { handleSignerDeclineWorkflow } from '../domain/rules/signer/SignerWorkflowRules';
import { createCancelledEnvelope } from '../domain/rules/envelope/EnvelopeBusinessRules';
import { validateSignerAddition, validateSignerRemoval, validateSignerUpdate, getNextSignerOrder } from '../domain/rules/signer/SignerManagementRules';
import { signerDdbMapper } from '../domain/types/infrastructure/signer/signer-mappers';
import { mapAwsError, NotFoundError, ErrorCodes, uuid } from '@lawprotect/shared-ts';

/**
 * Request interface for declining a signer
 */
export interface DeclineSignerRequest {
  readonly signerId: SignerId;
  readonly reason?: string;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly userId: string;
}

/**
 * SignerService
 * 
 * Service for managing signer operations and coordinating with other services.
 * Handles signer status transitions, decline logic, and envelope cancellation.
 */
export class SignerService {
  constructor(
    private readonly signerRepository: SignerRepository,
    private readonly envelopeRepository: EnvelopeRepository,
    private readonly auditService: AuditService,
    private readonly signerEventService: SignerEventService,
    private readonly envelopeEventService: EnvelopeEventService
  ) {}

  /**
   * Declines a signer and potentially cancels the envelope
   * 
   * Business logic:
   * 1. Signer can only decline if they haven't signed yet
   * 2. If signer declines, check if envelope should be cancelled
   * 3. Envelope can only be cancelled if not all signers have signed
   * 4. Signatures are never deleted (legal requirement)
   * 
   * @param request - The decline request
   * @returns The updated signer
   */
  async declineSigner(request: DeclineSignerRequest): Promise<Signer> {
    try {
      // Get signer and envelope
      const signer = await this.signerRepository.getById(request.signerId);
      if (!signer) {
        throw new NotFoundError(
          `Signer with ID ${request.signerId.getValue()} not found`,
          ErrorCodes.COMMON_NOT_FOUND
        );
      }

      const envelope = await this.envelopeRepository.getById(new EnvelopeId(signer.getEnvelopeId()));
      if (!envelope) {
        throw new NotFoundError(
          `Envelope with ID ${signer.getEnvelopeId()} not found`,
          ErrorCodes.COMMON_NOT_FOUND
        );
      }

      // Handle complete decline workflow using domain rules
      const declineWorkflowResult = handleSignerDeclineWorkflow(signer, envelope, {
        reason: request.reason,
        timestamp: new Date(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });

      // Update signer status to DECLINED
      const updatedSigner = await this.signerRepository.update(request.signerId, {
        status: SignerStatus.DECLINED,
        declinedAt: new Date(),
        metadata: {
          declineReason: request.reason,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent
        }
      });

      // Log audit event for signer decline
      await this.auditService.createEvent({
        envelopeId: signer.getEnvelopeId(),
        description: `Signer ${signer.getEmail().getValue()} declined to sign`,
        type: AuditEventType.SIGNER_DECLINED,
        userId: request.userId,
        metadata: {
          signerId: request.signerId.getValue(),
          declineReason: request.reason,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent
        }
      });

      // Publish signer declined event
      await this.signerEventService.publishSignerDeclined(
        updatedSigner,
        new Date(),
        request.reason
      );

      // Handle envelope cancellation if recommended by domain rules
      if (declineWorkflowResult.shouldCancelEnvelope) {
        // Create cancelled envelope using domain rules
        const cancelledEnvelope = createCancelledEnvelope(envelope);

        // Update the envelope in the repository
        await this.envelopeRepository.update(new EnvelopeId(signer.getEnvelopeId()), cancelledEnvelope);

        // Log audit event for envelope cancellation
        await this.auditService.createEvent({
          envelopeId: signer.getEnvelopeId(),
          description: `Envelope cancelled due to signer decline`,
          type: AuditEventType.ENVELOPE_CANCELLED,
          userId: request.userId,
          metadata: {
            signerId: request.signerId.getValue(),
            declineReason: request.reason,
            cancelledBy: 'signer_decline'
          }
        });

        // Publish envelope cancelled event
        await this.envelopeEventService.publishEnvelopeCancelled(
          cancelledEnvelope,
          new Date(),
          declineWorkflowResult.cancellationReason
        );
      } else {
        // Envelope should not be cancelled - log that envelope remains active
        await this.auditService.createEvent({
          envelopeId: signer.getEnvelopeId(),
          description: `Signer declined but envelope remains active (cannot cancel)`,
          type: AuditEventType.SIGNER_DECLINED,
          userId: request.userId,
          metadata: {
            signerId: request.signerId.getValue(),
            declineReason: request.reason,
            envelopeStatus: envelope.getStatus()
          }
        });
      }

      return updatedSigner;
    } catch (error) {
      throw mapAwsError(error, 'SignerService.declineSigner');
    }
  }

  /**
   * Gets a signer by ID
   */
  async getSigner(signerId: SignerId): Promise<Signer | null> {
    try {
      return await this.signerRepository.getById(signerId);
    } catch (error) {
      throw mapAwsError(error, 'SignerService.getSigner');
    }
  }

  /**
   * Gets signers by envelope ID
   */
  async getSignersByEnvelope(envelopeId: EnvelopeId): Promise<Signer[]> {
    try {
      const result = await this.signerRepository.getByEnvelope(envelopeId.getValue());
      // Convert DTOs to domain entities using the mapper
      return result.items.map(item => signerDdbMapper.fromDTO(item));
    } catch (error) {
      throw mapAwsError(error, 'SignerService.getSignersByEnvelope');
    }
  }

  /**
   * Creates multiple signers for an envelope
   * 
   * @param envelopeId - The envelope ID
   * @param signersData - Array of signer data from frontend
   * @param securityContext - Security context from middleware
   * @returns Array of created signers
   */
  async createSignersForEnvelope(
    envelopeId: EnvelopeId,
    signersData: Array<{
      email: string;
      fullName: string;
      order: number;
    }>,
    securityContext: {
      userId: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<Signer[]> {
    try {
      const signers: Signer[] = [];
      
      for (const signerData of signersData) {
        const signerId = new SignerId(uuid());
        
        // Create signer entity
        const signer = await this.signerRepository.create({
          id: signerId,
          envelopeId: envelopeId,
          email: new Email(signerData.email),
          fullName: signerData.fullName,
          status: SignerStatus.PENDING,
          order: signerData.order,
          metadata: {
            ipAddress: securityContext.ipAddress,
            userAgent: securityContext.userAgent,
            consentGiven: false,
            consentTimestamp: undefined,
            declineReason: undefined
          }
        });

        // Create audit event
        await this.auditService.createEvent({
          type: AuditEventType.SIGNER_ADDED,
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          userId: securityContext.userId,
          description: `Signer added to envelope: ${signerData.email}`,
          metadata: {
            signerEmail: signerData.email,
            signerName: signerData.fullName,
            order: signerData.order,
            ipAddress: securityContext.ipAddress,
            userAgent: securityContext.userAgent
          }
        });

        // Publish signer created event
        await this.signerEventService.publishSignerCreated(signer, securityContext.userId);
        
        signers.push(signer);
      }

      return signers;
    } catch (error) {
      throw mapAwsError(error, 'SignerService.createSignersForEnvelope');
    }
  }

  /**
   * Adds a new signer to an existing envelope
   * 
   * @param envelopeId - The envelope ID
   * @param signerData - The signer data
   * @param securityContext - Security context for audit
   * @returns Promise resolving to the created signer
   * 
   * @throws BadRequestError if signer cannot be added
   * @throws NotFoundError if envelope not found
   */
  async addSigner(
    envelopeId: EnvelopeId,
    signerData: {
      email: string;
      fullName: string;
    },
    securityContext: {
      userId: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<Signer> {
    try {
      // Get existing signers for validation
      const existingSigners = await this.getSignersByEnvelope(envelopeId);
      
      // Validate signer addition (only owner can add signers)
      validateSignerAddition(envelopeId, signerData.email, signerData.fullName, existingSigners, true);
      
      // Get next available order (simplified - assumes OWNER_FIRST for now)
      const order = getNextSignerOrder(existingSigners, SigningOrderType.OWNER_FIRST);
      
      // Create signer
      const signerId = new SignerId(uuid());
      const email = new Email(signerData.email);
      
      const signer = new Signer(
        signerId,
        envelopeId.getValue(),
        email,
        signerData.fullName,
        SignerStatus.PENDING,
        order
      );
      
      // Save to repository
      await this.signerRepository.create({
        id: signerId,
        envelopeId: envelopeId,
        email: email,
        fullName: signerData.fullName,
        order: order,
        status: SignerStatus.PENDING,
        metadata: {
          consentGiven: false
        }
      });
      
      // Create audit event
      await this.auditService.createEvent({
        type: AuditEventType.SIGNER_ADDED,
        userId: securityContext.userId,
        envelopeId: envelopeId.getValue(),
        signerId: signerId.getValue(),
        description: 'Signer added to envelope',
        metadata: {
          email: signerData.email,
          fullName: signerData.fullName,
          order: order.toString()
        }
      });
      
      // Publish event
      await this.signerEventService.publishSignerCreated(signer, securityContext.userId);
      
      return signer;
    } catch (error) {
      throw mapAwsError(error, 'SignerService.addSigner');
    }
  }

  /**
   * Removes a signer from an envelope
   * 
   * @param signerId - The signer ID to remove
   * @param securityContext - Security context for audit
   * @returns Promise resolving when signer is removed
   * 
   * @throws BadRequestError if signer cannot be removed
   * @throws NotFoundError if signer not found
   */
  async removeSigner(
    signerId: SignerId,
    securityContext: {
      userId: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      // Get signer for validation
      const signer = await this.getSigner(signerId);
      if (!signer) {
        throw new NotFoundError('Signer not found', 'SIGNER_NOT_FOUND');
      }
      
      // Validate signer removal (only owner can remove signers)
      validateSignerRemoval(signer, new EnvelopeId(signer.getEnvelopeId()), true);
      
      // Remove from repository
      await this.signerRepository.delete(signerId);
      
      // Create audit event
      await this.auditService.createEvent({
        type: AuditEventType.SIGNER_REMOVED,
        userId: securityContext.userId,
        envelopeId: signer.getEnvelopeId(),
        signerId: signerId.getValue(),
        description: 'Signer removed from envelope',
        metadata: {
          email: signer.getEmail().getValue(),
          fullName: signer.getFullName(),
          status: signer.getStatus()
        }
      });
      
      // Publish event
      await this.signerEventService.publishSignerDeleted(
        signerId.getValue(),
        signer.getEnvelopeId(),
        signer.getEmail().getValue(),
        securityContext.userId
      );
    } catch (error) {
      throw mapAwsError(error, 'SignerService.removeSigner');
    }
  }


  /**
   * Sends reminder notifications to signers
   *
   * Business logic:
   * - Envelope must be in SENT state
   * - If signerIds provided, remind only those; otherwise remind all PENDING signers
   * - Publish signer.reminder event per recipient
   * - Create audit event summarizing action
   */
  async sendReminders(
    envelopeId: EnvelopeId,
    signerIds: string[] | undefined,
    securityContext: {
      userId: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{ sent: number; recipients: Array<{ signerId: string; email: string }> }> {
    try {
      const envelope = await this.envelopeRepository.getById(envelopeId);
      if (!envelope) {
        throw new NotFoundError('Envelope not found', ErrorCodes.COMMON_NOT_FOUND);
      }

      if (envelope.getStatus() !== 'SENT') {
        throw new Error('Reminders can only be sent for envelopes that have been sent');
      }

      const allSigners = await this.getSignersByEnvelope(envelopeId);
      let recipients = allSigners.filter(s => s.getStatus() === SignerStatus.PENDING);
      if (signerIds && signerIds.length > 0) {
        const idSet = new Set(signerIds);
        recipients = recipients.filter(s => idSet.has(s.getId().getValue()));
      }

      for (const signer of recipients) {
        await this.signerEventService.publishSignerReminder(signer, securityContext.userId);
      }

      await this.auditService.createEvent({
        type: AuditEventType.SIGNER_REMINDER_SENT,
        userId: securityContext.userId,
        envelopeId: envelopeId.getValue(),
        signerId: 'multiple',
        description: `Reminder notifications sent to ${recipients.length} signers`,
        metadata: {
          signerIds: recipients.map(r => r.getId().getValue()),
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent
        }
      });

      return {
        sent: recipients.length,
        recipients: recipients.map(r => ({ signerId: r.getId().getValue(), email: r.getEmail().getValue() }))
      };
    } catch (error) {
      throw mapAwsError(error, 'SignerService.sendReminders');
    }
  }

  /**
   * Updates a signer's information
   * 
   * @param signerId - The signer ID to update
   * @param updateData - The data to update
   * @param securityContext - Security context for audit
   * @returns Promise resolving to the updated signer
   * 
   * @throws BadRequestError if signer cannot be updated
   * @throws NotFoundError if signer not found
   */
  async updateSigner(
    signerId: SignerId,
    updateData: {
      email?: string;
      fullName?: string;
    },
    securityContext: {
      userId: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<Signer> {
    try {
      // Get signer for validation
      const signer = await this.getSigner(signerId);
      if (!signer) {
        throw new NotFoundError('Signer not found', 'SIGNER_NOT_FOUND');
      }
      
      // Validate signer update (only owner can update signers)
      validateSignerUpdate(signer, updateData.email, updateData.fullName, true);
      
      // Update signer using repository update method
      const updatedSigner = await this.signerRepository.update(signerId, {
        email: updateData.email ? new Email(updateData.email) : undefined,
        fullName: updateData.fullName || undefined,
        status: signer.getStatus(),
        signedAt: signer.getSignedAt(),
        declinedAt: signer.getDeclinedAt(),
        metadata: {
          consentGiven: false
        }
      });
      
      // Create audit event
      await this.auditService.createEvent({
        type: AuditEventType.SIGNER_ADDED,
        userId: securityContext.userId,
        envelopeId: signer.getEnvelopeId(),
        signerId: signerId.getValue(),
        description: 'Signer information updated',
        metadata: {
          oldEmail: signer.getEmail().getValue(),
          newEmail: updateData.email || signer.getEmail().getValue(),
          oldFullName: signer.getFullName(),
          newFullName: updateData.fullName || signer.getFullName()
        }
      });
      
      // Publish event
      await this.signerEventService.publishSignerUpdated(updatedSigner, securityContext.userId, {
        email: updateData.email,
        fullName: updateData.fullName
      });
      
      return updatedSigner;
    } catch (error) {
      throw mapAwsError(error, 'SignerService.updateSigner');
    }
  }
}
