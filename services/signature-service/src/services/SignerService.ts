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
import { EnvelopeService } from './EnvelopeService';
import { handleSignerDeclineWorkflow } from '../domain/rules/signer/SignerWorkflowRules';
import { createCancelledEnvelope } from '../domain/rules/envelope/EnvelopeBusinessRules';
import { validateSignerAddition, validateSignerRemoval, validateSignerUpdate, getNextSignerOrder } from '../domain/rules/signer/SignerManagementRules';
import { signerDdbMapper } from '../domain/types/infrastructure/signer/signer-mappers';
import { mapAwsError, NotFoundError, BadRequestError, ForbiddenError, ErrorCodes, uuid } from '@lawprotect/shared-ts';

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
      console.log('[SignerService.declineSigner] Starting decline process', {
        signerId: request.signerId.getValue(),
        userId: request.userId,
        reason: request.reason
      });

      // Get signer and envelope
      console.log('[SignerService.declineSigner] Getting signer from repository');
      const signer = await this.signerRepository.getById(request.signerId);
      if (!signer) {
        console.log('[SignerService.declineSigner] Signer not found');
        throw new NotFoundError(
          `Signer with ID ${request.signerId.getValue()} not found`,
          ErrorCodes.COMMON_NOT_FOUND
        );
      }
      console.log('[SignerService.declineSigner] Signer found', {
        signerId: signer.getId().getValue(),
        envelopeId: signer.getEnvelopeId(),
        status: signer.getStatus(),
        email: signer.getEmail().getValue()
      });

      console.log('[SignerService.declineSigner] Getting envelope from repository');
      const envelope = await this.envelopeRepository.getById(new EnvelopeId(signer.getEnvelopeId()));
      if (!envelope) {
        console.log('[SignerService.declineSigner] Envelope not found');
        throw new NotFoundError(
          `Envelope with ID ${signer.getEnvelopeId()} not found`,
          ErrorCodes.COMMON_NOT_FOUND
        );
      }
      console.log('[SignerService.declineSigner] Envelope found', {
        envelopeId: envelope.getId().getValue(),
        status: envelope.getStatus(),
        signerCount: envelope.getSigners().length
      });

      // Handle complete decline workflow using domain rules
      console.log('[SignerService.declineSigner] Validating decline workflow');
      const declineWorkflowResult = handleSignerDeclineWorkflow(signer, envelope, {
        reason: request.reason,
        timestamp: new Date(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });
      console.log('[SignerService.declineSigner] Workflow validation completed', {
        shouldCancelEnvelope: declineWorkflowResult.shouldCancelEnvelope,
        cancellationReason: declineWorkflowResult.cancellationReason
      });

      // Update signer status to DECLINED
      console.log('[SignerService.declineSigner] Updating signer status to DECLINED');
      const updatedSigner = await this.signerRepository.update(request.signerId, {
        status: SignerStatus.DECLINED,
        declinedAt: new Date(),
        metadata: {
          declineReason: request.reason,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent
        }
      });
      console.log('[SignerService.declineSigner] Signer status updated successfully');

      // Log audit event for signer decline
      console.log('[SignerService.declineSigner] Creating audit event for signer decline');
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
      console.log('[SignerService.declineSigner] Audit event created successfully');

      // Publish signer declined event
      console.log('[SignerService.declineSigner] Publishing signer declined event');
      await this.signerEventService.publishSignerDeclined(
        updatedSigner,
        new Date(),
        request.reason
      );
      console.log('[SignerService.declineSigner] Signer declined event published successfully');

      // Handle envelope cancellation if recommended by domain rules
      if (declineWorkflowResult.shouldCancelEnvelope) {
        console.log('[SignerService.declineSigner] Cancelling envelope due to signer decline');
        
        // Create cancelled envelope using domain rules
        console.log('[SignerService.declineSigner] Creating cancelled envelope');
        const cancelledEnvelope = createCancelledEnvelope(envelope);

        // Update the envelope in the repository
        console.log('[SignerService.declineSigner] Updating envelope status to CANCELLED');
        await this.envelopeRepository.update(new EnvelopeId(signer.getEnvelopeId()), cancelledEnvelope);

        // Log audit event for envelope cancellation
        console.log('[SignerService.declineSigner] Creating audit event for envelope cancellation');
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
        console.log('[SignerService.declineSigner] Publishing envelope cancelled event');
        await this.envelopeEventService.publishEnvelopeCancelled(
          cancelledEnvelope,
          new Date(),
          declineWorkflowResult.cancellationReason
        );
        console.log('[SignerService.declineSigner] Envelope cancellation completed successfully');
      } else {
        console.log('[SignerService.declineSigner] Envelope will not be cancelled');
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
        console.log('[SignerService.declineSigner] Additional audit event created');
      }

      console.log('[SignerService.declineSigner] Decline process completed successfully');
      return updatedSigner;
    } catch (error) {
      console.error('[SignerService.declineSigner] Error occurred:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        signerId: request.signerId.getValue(),
        userId: request.userId
      });
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
      // eslint-disable-next-line no-console
      console.log('[SignerService.getSignersByEnvelope] querying', { envelopeId: envelopeId.getValue() });
      const result = await this.signerRepository.getByEnvelope(envelopeId.getValue());
      // eslint-disable-next-line no-console
      console.log('[SignerService.getSignersByEnvelope] result', { count: result.items.length, firstKeys: result.items[0] ? Object.keys(result.items[0] as any) : [] });
      // Convert DTOs to domain entities using the mapper
      const mapped = result.items.map(item => signerDdbMapper.fromDTO(item as any));
      // eslint-disable-next-line no-console
      console.log('[SignerService.getSignersByEnvelope] mapped', { count: mapped.length });
      return mapped;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[SignerService.getSignersByEnvelope] ERROR', { name: (error as any)?.name, code: (error as any)?.code, message: (error as any)?.message });
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
      ipAddress: string;
      userAgent: string;
      country: string;
    },
    actorEmail?: string
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

        // Create audit event only for non-owner external signers
        if (!actorEmail || signerData.email.toLowerCase() !== actorEmail.toLowerCase()) {
          await this.auditService.createEvent({
          type: AuditEventType.SIGNER_ADDED,
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          userId: securityContext.userId,
          country: securityContext.country,
          description: `Signer added to envelope: ${signerData.email}`,
          metadata: {
            signerEmail: signerData.email,
            signerName: signerData.fullName,
            order: signerData.order,
            actorIpAddress: securityContext.ipAddress,
            actorUserAgent: securityContext.userAgent,
            actorCountry: securityContext.country
          }
          });
        }

        // Publish signer created event only for external signers
        if (!actorEmail || signerData.email.toLowerCase() !== actorEmail.toLowerCase()) {
          await this.signerEventService.publishSignerCreated(signer, securityContext.userId);
        }
        
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
      ipAddress: string;
      userAgent: string;
      country?: string;
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
          order: order,
          actorIpAddress: securityContext.ipAddress,
          actorUserAgent: securityContext.userAgent,
          actorCountry: securityContext.country
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
      // Only map AWS errors, let domain errors pass through
      if (error instanceof BadRequestError || error instanceof ForbiddenError || error instanceof NotFoundError) {
        throw error;
      }
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
      // eslint-disable-next-line no-console
      console.log('[SignerService.sendReminders] START', { envelopeId: envelopeId.getValue(), signerIdsCount: signerIds?.length || 0, userId: securityContext.userId });
      const envelope = await this.envelopeRepository.getById(envelopeId);
      if (!envelope) {
        throw new NotFoundError('Envelope not found', ErrorCodes.COMMON_NOT_FOUND);
      }

      if (envelope.getStatus() !== 'SENT' && envelope.getStatus() !== 'IN_PROGRESS') {
        throw new BadRequestError(
          'Reminders can only be sent for envelopes that are SENT or IN_PROGRESS',
          'ENVELOPE_NOT_READY_FOR_NOTIFICATIONS'
        );
      }

      const allSigners = await this.getSignersByEnvelope(envelopeId);
      let recipients = allSigners.filter(s => s.getStatus() === SignerStatus.PENDING);
      if (signerIds && signerIds.length > 0) {
        const idSet = new Set(signerIds);
        recipients = recipients.filter(s => idSet.has(s.getId().getValue()));
      }

      // eslint-disable-next-line no-console
      console.log('[SignerService.sendReminders] recipients', { count: recipients.length });
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

      // eslint-disable-next-line no-console
      console.log('[SignerService.sendReminders] DONE', { sent: recipients.length });
      return {
        sent: recipients.length,
        recipients: recipients.map(r => ({ signerId: r.getId().getValue(), email: r.getEmail().getValue() }))
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[SignerService.sendReminders] ERROR', { name: (error as any)?.name, code: (error as any)?.code, message: (error as any)?.message });
      // Let domain errors through so they map to 4xx, only map AWS errors
      if (error instanceof BadRequestError || error instanceof ForbiddenError || error instanceof NotFoundError) {
        throw error;
      }
      throw mapAwsError(error, 'SignerService.sendReminders');
    }
  }

  /**
   * Marks a signer as signed and publishes signer.signed event if envelope has multiple signers
   * 
   * @param signerId - The signer ID to mark as signed
   * @param securityContext - Security context for audit
   * @returns Promise resolving to the updated signer
   * 
   * @throws NotFoundError if signer not found
   */
  async markSignerAsSigned(
    signerId: SignerId,
    securityContext: {
      userId: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<Signer> {
    try {
      const signer = await this.getSigner(signerId);
      if (!signer) {
        throw new NotFoundError('Signer not found', 'SIGNER_NOT_FOUND');
      }

      await this.validateSigningOrderConstraints(signer);
      this.updateSignerForSigning(signer, securityContext);
      const updatedSigner = await this.persistSignerUpdate(signerId, signer);
      await this.publishSignerSignedEvent(signer, updatedSigner);

      return updatedSigner;
    } catch (error) {
      console.error('SignerService.markSignerAsSigned error:', error);
      // Allow domain errors to pass through with correct status
      if (error instanceof BadRequestError || error instanceof ForbiddenError || error instanceof NotFoundError) {
        throw error;
      }
      throw mapAwsError(error, 'SignerService.markSignerAsSigned');
    }
  }

  /**
   * Validates signing order constraints
   */
  private async validateSigningOrderConstraints(signer: Signer): Promise<void> {
    const envelope = await this.envelopeRepository.getById(new EnvelopeId(signer.getEnvelopeId()));
    if (!envelope) return;

    const signingOrder = envelope.getSigningOrder();
    const isOwnerFirst = this.isOwnerFirstSigningOrder(signingOrder);

    if (!isOwnerFirst) return;

    const signers = await this.getSignersByEnvelope(new EnvelopeId(signer.getEnvelopeId()));
    const ownerSigner = signers.find(s => s.getOrder() === 1);
    const ownerHasSigned = ownerSigner ? ownerSigner.getStatus() === SignerStatus.SIGNED : false;
    const isCurrentSignerOwner = signer.getOrder() === 1;

    if (!ownerHasSigned && !isCurrentSignerOwner) {
      const { BadRequestError } = await import('@lawprotect/shared-ts');
      throw new BadRequestError('Owner must sign first before invitees can sign', 'OWNER_MUST_SIGN_FIRST');
    }
  }

  /**
   * Checks if signing order is owner first
   */
  private isOwnerFirstSigningOrder(signingOrder: any): boolean {
    return typeof (signingOrder as any)?.isOwnerFirst === 'function'
      ? (signingOrder as any).isOwnerFirst()
      : String(signingOrder).toUpperCase().includes('OWNER');
  }

  /**
   * Updates signer for signing
   */
  private updateSignerForSigning(
    signer: Signer,
    securityContext: { ipAddress?: string; userAgent?: string }
  ): void {
    // Record consent first (required for signing)
    signer.recordConsent(securityContext.ipAddress, securityContext.userAgent);
    
    // Use the entity method (includes validations)
    signer.markAsSigned();
    
    // Update additional metadata
    const metadata = signer.getMetadata();
    metadata.ipAddress = securityContext.ipAddress;
    metadata.userAgent = securityContext.userAgent;
  }

  /**
   * Persists signer update to repository
   */
  private async persistSignerUpdate(signerId: SignerId, signer: Signer): Promise<Signer> {
    return await this.signerRepository.update(signerId, {
      status: signer.getStatus(),
      signedAt: signer.getSignedAt(),
      metadata: signer.getMetadata()
    });
  }

  /**
   * Publishes signer signed event if applicable
   */
  private async publishSignerSignedEvent(signer: Signer, updatedSigner: Signer): Promise<void> {
    // Publish event only if envelope has multiple signers (following EnvelopeService pattern)
    const allSigners = await this.getSignersByEnvelope(new EnvelopeId(signer.getEnvelopeId()));
    if (allSigners.length > 1) {
      await this.signerEventService.publishSignerSigned(updatedSigner, new Date());
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

  /**
   * Validates signing order for a signer without requiring envelope access
   * This prevents 403 errors when external signers try to sign out of order
   */
  async validateSigningOrder(
    envelopeId: EnvelopeId,
    signerId: SignerId,
    envelopeService: EnvelopeService,
    userId: string,
    securityContext: any
  ): Promise<void> {
    try {
      // Get all signers for the envelope
      const allSigners = await this.getSignersByEnvelope(envelopeId);
      
      // Get the current signer
      const currentSigner = allSigners.find(s => s.getId().getValue() === signerId.getValue());
      if (!currentSigner) {
        throw new BadRequestError(
          `Signer ${signerId.getValue()} not found in envelope ${envelopeId.getValue()}`,
          'SIGNER_NOT_FOUND'
        );
      }

      // Check if signer is already signed
      if (currentSigner.getStatus() === SignerStatus.SIGNED) {
        throw new BadRequestError(
          `Signer ${signerId.getValue()} has already signed`,
          'SIGNER_ALREADY_SIGNED'
        );
      }

      // Check if signer is declined
      if (currentSigner.getStatus() === SignerStatus.DECLINED) {
        throw new BadRequestError(
          `Signer ${signerId.getValue()} has declined to sign`,
          'SIGNER_DECLINED'
        );
      }

      // Try to get envelope to check signing order type, but don't fail if we can't access it
      let signingOrderType: SigningOrderType | null = null;
      try {
        const envelope = await envelopeService.getEnvelope(envelopeId, userId, securityContext);
        signingOrderType = envelope.getSigningOrder().getType() as SigningOrderType;
      } catch (envelopeError) {
        // If we can't access the envelope, we'll skip signing order validation
        // This allows external signers to proceed when they have valid invitation tokens
        console.log('[SignerService] Cannot access envelope for signing order validation, skipping:', envelopeError);
        return; // Allow signing to proceed
      }

      // Validate signing order based on type (only if we could determine the type)
      if (signingOrderType === SigningOrderType.OWNER_FIRST) {
        // In OWNER_FIRST, owner (order 1) must sign before any other signer
        if (currentSigner.getOrder() > 1) {
          // Check if owner has already signed
          const owner = allSigners.find(s => s.getOrder() === 1);
          if (owner && owner.getStatus() !== SignerStatus.SIGNED) {
            throw new BadRequestError(
              'Owner must sign first in OWNER_FIRST flow',
              'OWNER_MUST_SIGN_FIRST'
            );
          }
        }
      } else if (signingOrderType === SigningOrderType.INVITEES_FIRST) {
        // In INVITEES_FIRST, all invitees must sign before owner
        if (currentSigner.getOrder() === 1) {
          // Check if any invitee is still pending
          const pendingInvitees = allSigners.filter(s => s.getOrder() > 1 && s.getStatus() === SignerStatus.PENDING);
          if (pendingInvitees.length > 0) {
            throw new BadRequestError(
              'All invitees must sign before owner in INVITEES_FIRST flow',
              'INVITEES_MUST_SIGN_FIRST'
            );
          }
        }
      }

    } catch (error) {
      // If it's a BadRequestError, re-throw it
      if (error instanceof BadRequestError) {
        throw error;
      }
      
      // For other errors, we'll allow the signing to proceed
      // This is a fallback to prevent blocking legitimate signers due to access issues
      console.log('[SignerService] Signing order validation failed, allowing signing to proceed:', error);
    }
  }
}
