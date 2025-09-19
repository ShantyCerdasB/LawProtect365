/**
 * @fileoverview ConsentService - Business logic service for consent operations
 * @summary Provides business logic for consent management
 * @description This service handles all business logic for consent operations
 * including creation, validation, and coordination with other services.
 */

import { Consent } from '../domain/entities/Consent';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { ConsentRepository } from '../repositories/ConsentRepository';
import { SignerRepository } from '../repositories/SignerRepository';
import { AuditService } from './AuditService';
import { ConsentEventService } from './events/ConsentEventService';
import { CreateConsentRequest } from '../domain/types/consent/CreateConsentRequest';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError, ErrorCodes } from '@lawprotect/shared-ts';

/**
 * ConsentService implementation
 * 
 * Provides business logic for consent operations including validation,
 * status management, and coordination with other services.
 */
export class ConsentService {
  constructor(
    private readonly consentRepository: ConsentRepository,
    private readonly signerRepository: SignerRepository,
    private readonly auditService: AuditService,
    private readonly eventService: ConsentEventService
  ) {}

  /**
   * Creates a new consent
   * @param request - The create consent request
   * @param userId - The user creating the consent
   * @returns The created consent
   */
  async createConsent(request: CreateConsentRequest, userId: string): Promise<Consent> {
    // Validate business rules
    await this.validateCreateConsentRequest(request, userId);

    // Save consent (request now may include userEmail and country)
    const createdConsent = await this.consentRepository.create(request);

    // Create audit event
    await this.auditService.createEvent({
      type: AuditEventType.CONSENT_GIVEN,
      envelopeId: request.envelopeId.getValue(),
      userId,
      userEmail: request.userEmail,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      country: (request as any).country,
      description: `Consent given by signer ${request.signerId.getValue()}`,
      metadata: {
        consentId: createdConsent.getId().getValue(),
        signerId: request.signerId.getValue(),
        envelopeId: request.envelopeId.getValue(),
        consentGiven: request.consentGiven
      }
    });

    // Publish event
    await this.eventService.publishEvent('consent.created', {
      consentId: createdConsent.getId().getValue(),
      signerId: request.signerId.getValue(),
      envelopeId: request.envelopeId.getValue(),
      userId,
      consentGiven: request.consentGiven
    });

    return createdConsent;
  }




  /**
   * Gets consent by signer and envelope
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @param userId - The user requesting the consent
   * @returns The consent or null if not found
   */
  async getConsentBySignerAndEnvelope(signerId: string, envelopeId: string, userId: string): Promise<Consent | null> {
    // Create value objects
    const signerIdVO = new SignerId(signerId);
    const envelopeIdVO = new EnvelopeId(envelopeId);
    
    // Validate user has access to signer
    const signer = await this.signerRepository.getById(signerIdVO);
    if (!signer) {
      throw new NotFoundError(
        `Signer with ID ${signerId} not found`,
        ErrorCodes.COMMON_NOT_FOUND
      );
    }

    // Check if user is the signer themselves
    // For external users (userId = 'external-user'), we allow consent access
    // as the signer identity is validated through the invitation token
    if (userId !== 'external-user' && signer.getEmail().getValue() !== userId) {
      throw new ForbiddenError(
        `User ${userId} is not authorized to access consent for signer ${signerId}`,
        ErrorCodes.AUTH_FORBIDDEN
      );
    }

    return this.consentRepository.getBySignerAndEnvelope(signerIdVO, envelopeIdVO);
  }

  /**
   * Validates create consent request
   * @param request - The create request
   * @param userId - The user creating the consent
   */
  private async validateCreateConsentRequest(request: CreateConsentRequest, userId: string): Promise<void> {
    // Validate signer exists and user has access
    const signer = await this.signerRepository.getById(request.signerId);
    if (!signer) {
      throw new NotFoundError(
        `Signer with ID ${request.signerId.getValue()} not found`,
        ErrorCodes.COMMON_NOT_FOUND
      );
    }

    // Check if user is the signer themselves
    // For external users (userId = 'external-user'), we allow consent creation
    // as the signer identity is validated through the invitation token
    if (userId !== 'external-user' && signer.getEmail().getValue() !== userId) {
      throw new ForbiddenError(
        `User ${userId} is not authorized to create consent for signer ${request.signerId.getValue()}`,
        ErrorCodes.AUTH_FORBIDDEN
      );
    }

    // Validate envelope matches signer's envelope
    if (signer.getEnvelopeId() !== request.envelopeId.getValue()) {
      throw new BadRequestError(
        'Envelope ID does not match signer\'s envelope',
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }

    // Check if consent already exists
    const existingConsent = await this.consentRepository.getBySignerAndEnvelope(
      request.signerId,
      request.envelopeId
    );
    if (existingConsent) {
      throw new ConflictError(
        `Consent already exists for signer ${request.signerId.getValue()} and envelope ${request.envelopeId.getValue()}`,
        ErrorCodes.COMMON_CONFLICT
      );
    }
  }

}