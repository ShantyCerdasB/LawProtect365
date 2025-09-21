/**
 * @fileoverview ConsentService - Business logic service for consent operations
 * @summary Provides business logic for consent management using new architecture
 * @description This service handles all business logic for consent operations
 * including creation, validation, and coordination with other services using
 * the new Prisma-based architecture with proper separation of concerns.
 */

import { Consent } from '../domain/entities/Consent';
import { ConsentId } from '../domain/value-objects/ConsentId';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { ConsentRepository } from '../repositories/ConsentRepository';
import { EnvelopeSignerRepository } from '../repositories/EnvelopeSignerRepository';
import { InvitationTokenRepository } from '../repositories/InvitationTokenRepository';
import { SignatureAuditEventService } from './SignatureAuditEventService';
import { CreateConsentRequest } from '../domain/types/consent/CreateConsentRequest';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { 
  consentNotFound,
  consentAlreadyExists,
  consentCreationFailed,
  signerNotFound,
  envelopeNotFound
} from '../signature-errors';

/**
 * ConsentService implementation
 * 
 * Provides business logic for consent operations including creation, validation,
 * and coordination with other services. Uses the new Prisma-based architecture
 * with proper separation of concerns between entities, repositories, and services.
 */
export class ConsentService {
  constructor(
    private readonly consentRepository: ConsentRepository,
    private readonly envelopeSignerRepository: EnvelopeSignerRepository,
    private readonly invitationTokenRepository: InvitationTokenRepository,
    private readonly signatureAuditEventService: SignatureAuditEventService
  ) {}

  /**
   * Creates a new consent
   * @param request - The create consent request
   * @param userId - The user creating the consent
   * @returns The created consent
   */
  async createConsent(request: CreateConsentRequest, userId: string): Promise<Consent> {
    try {
      // Validate business rules
      await this.validateConsentCreation(request, userId);

      // Create consent entity
      const consent = Consent.create({
        id: request.id,
        envelopeId: request.envelopeId,
        signerId: request.signerId,
        signatureId: request.signatureId,
        consentGiven: request.consentGiven,
        consentTimestamp: request.consentTimestamp,
        consentText: request.consentText,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });

      // Validate compliance using entity method
      consent.validateForCompliance();

      // Save to repository
      const createdConsent = await this.consentRepository.create(consent);

      // Update signer consent status
      await this.updateSignerConsentStatus(request.signerId, request.consentText, request.ipAddress, request.userAgent);

      // Create audit event
      await this.signatureAuditEventService.createEvent({
        envelopeId: request.envelopeId.getValue(),
        signerId: request.signerId.getValue(),
        eventType: AuditEventType.CONSENT_GIVEN,
        description: `Consent given by signer ${request.signerId.getValue()}`,
        userId: userId,
        userEmail: request.userEmail,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        country: request.country,
        metadata: {
          consentId: createdConsent.getId().getValue(),
          consentGiven: request.consentGiven,
          consentText: request.consentText
        }
      });

      return createdConsent;
    } catch (error) {
      throw consentCreationFailed(
        `Failed to create consent: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets consent by signer and envelope
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @param userId - The user requesting the consent
   * @param invitationToken - Optional invitation token for external users
   * @returns The consent or null if not found
   */
  async getConsentBySignerAndEnvelope(signerId: SignerId, envelopeId: EnvelopeId, userId: string, invitationToken?: string): Promise<Consent | null> {
    try {
      // Validate user has access to signer
      await this.validateUserAccessToSigner(signerId, userId, invitationToken);

      // Get consent from repository
      return await this.consentRepository.findBySignerAndEnvelope(signerId, envelopeId);
    } catch (error) {
      throw consentNotFound(
        `Failed to get consent for signer ${signerId.getValue()}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Links consent with signature
   * @param consentId - The consent ID
   * @param signatureId - The signature ID to link
   * @returns Updated consent
   */
  async linkConsentWithSignature(consentId: ConsentId, signatureId: SignerId): Promise<Consent> {
    try {
      // Get existing consent
      const existingConsent = await this.consentRepository.findById(consentId);
      if (!existingConsent) {
        throw consentNotFound(`Consent with ID ${consentId.getValue()} not found`);
      }

      // Create updated consent with signature link
      const updatedConsent = existingConsent.linkWithSignature(signatureId);

      // Update in repository
      return await this.consentRepository.update(consentId, updatedConsent);
    } catch (error) {
      throw consentCreationFailed(
        `Failed to link consent with signature: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Validates consent for signing
   * @param consentId - The consent ID to validate
   * @returns void if valid, throws error if invalid
   */
  async validateConsentForSigning(consentId: ConsentId): Promise<void> {
    try {
      const consent = await this.consentRepository.findById(consentId);
      if (!consent) {
        throw consentNotFound(`Consent with ID ${consentId.getValue()} not found`);
      }

      // Use entity validation method
      consent.validateForCompliance();
    } catch (error) {
      throw consentNotFound(
        `Consent validation failed: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Gets consents by envelope
   * @param envelopeId - The envelope ID
   * @returns Array of consents
   */
  async getConsentsByEnvelope(envelopeId: EnvelopeId): Promise<Consent[]> {
    return this.consentRepository.findByEnvelopeId(envelopeId);
  }

  /**
   * Gets consents by signer
   * @param signerId - The signer ID
   * @returns Array of consents
   */
  async getConsentsBySigner(signerId: SignerId): Promise<Consent[]> {
    return this.consentRepository.findBySignerId(signerId);
  }

  /**
   * Counts consents by envelope
   * @param envelopeId - The envelope ID
   * @returns Number of consents
   */
  async countConsentsByEnvelope(envelopeId: EnvelopeId): Promise<number> {
    return this.consentRepository.countByEnvelopeId(envelopeId);
  }

  /**
   * Checks if consent exists for signer and envelope
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @returns True if consent exists
   */
  async consentExists(signerId: SignerId, envelopeId: EnvelopeId): Promise<boolean> {
    return this.consentRepository.existsBySignerAndEnvelope(signerId, envelopeId);
  }

  /**
   * Validates consent creation request
   * @param request - The create request
   * @param userId - The user creating the consent
   */
  private async validateConsentCreation(request: CreateConsentRequest, userId: string): Promise<void> {
    // Validate signer exists and user has access
    await this.validateUserAccessToSigner(request.signerId, userId, request.invitationToken);

    // Validate envelope exists
    const envelope = await this.envelopeSignerRepository.findByEnvelopeId(request.envelopeId);
    if (!envelope || envelope.length === 0) {
      throw envelopeNotFound(`Envelope with ID ${request.envelopeId.getValue()} not found`);
    }

    // Check if consent already exists
    const existingConsent = await this.consentRepository.findBySignerAndEnvelope(
      request.signerId,
      request.envelopeId
    );
    if (existingConsent) {
      throw consentAlreadyExists(
        `Consent already exists for signer ${request.signerId.getValue()} and envelope ${request.envelopeId.getValue()}`
      );
    }
  }

  /**
   * Validates user access to signer
   * @param signerId - The signer ID
   * @param userId - The user ID
   * @param invitationToken - Optional invitation token for external users
   */
  private async validateUserAccessToSigner(signerId: SignerId, userId: string, invitationToken?: string): Promise<void> {
    const signer = await this.envelopeSignerRepository.findById(signerId);
    if (!signer) {
      throw signerNotFound(`Signer with ID ${signerId.getValue()} not found`);
    }

    // For external users, validate through invitation token
    if (userId === 'external-user') {
      if (!invitationToken) {
        throw signerNotFound('Invitation token is required for external users');
      }

      // Validate invitation token
      const token = await this.invitationTokenRepository.getByToken(invitationToken);
      if (!token) {
        throw signerNotFound('Invalid invitation token');
      }

      // Validate that the token belongs to this signer
      if (!token.getSignerId().equals(signerId)) {
        throw signerNotFound('Invitation token does not belong to this signer');
      }

      // Validate that the signer was invited by the owner who created the token
      if (signer.getInvitedByUserId() !== token.getCreatedBy()) {
        throw signerNotFound('Signer was not invited by the token creator');
      }

      // Validate that the signer is external
      if (!signer.getIsExternal()) {
        throw signerNotFound('Signer is not external');
      }
    } else {
      // For authenticated users, validate ownership
      if (signer.getUserId() !== userId) {
        throw signerNotFound(`User ${userId} is not authorized to access signer ${signerId.getValue()}`);
      }
    }
  }

  /**
   * Updates signer consent status
   * @param signerId - The signer ID
   * @param consentText - The consent text
   * @param ipAddress - The IP address
   * @param userAgent - The user agent
   */
  private async updateSignerConsentStatus(
    signerId: SignerId, 
    consentText: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<void> {
    try {
      // Get current signer
      const currentSigner = await this.envelopeSignerRepository.findById(signerId);
      if (!currentSigner) {
        console.error('Signer not found for consent status update', { signerId: signerId.getValue() });
        return;
      }

      // Record consent using entity method
      currentSigner.recordConsent(consentText, ipAddress, userAgent);

      // Update signer with new consent status
      await this.envelopeSignerRepository.update(signerId, currentSigner);
    } catch (error) {
      // Log error but don't fail the consent creation
      console.error('Failed to update signer consent status', {
        signerId: signerId.getValue(),
        error: error instanceof Error ? error.message : error
      });
    }
  }
}