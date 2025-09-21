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
import { SignatureAuditEventService } from './SignatureAuditEventService';
import { InvitationTokenService } from './InvitationTokenService';
import { CreateConsentRequest } from '../domain/types/consent/CreateConsentRequest';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { 
  consentNotFound,
  consentAlreadyExists,
  consentCreationFailed
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
    private readonly signatureAuditEventService: SignatureAuditEventService,
    private readonly invitationTokenService: InvitationTokenService
  ) {}

  /**
   * Validates signer access using invitation token
   * @param signerId - The signer ID
   * @param invitationToken - The invitation token
   */
  private async validateSignerAccessWithToken(
    signerId: SignerId, 
    invitationToken: string
  ): Promise<void> {
    const token = await this.invitationTokenService.validateInvitationToken(invitationToken);
    await this.invitationTokenService.validateSignerAccess(signerId, token);
  }

  /**
   * Creates a new consent
   * @param request - The create consent request
   * @param userId - The user creating the consent
   * @returns The created consent
   */
  async createConsent(request: CreateConsentRequest, userId: string): Promise<Consent> {
    try {
      // Validate business rules
      await this.validateConsentCreation(request);

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

      // Create audit event
      await this.signatureAuditEventService.createSignerAuditEvent(
        request.envelopeId.getValue(),
        request.signerId.getValue(),
        AuditEventType.CONSENT_GIVEN,
        `Consent given by signer ${request.signerId.getValue()}`,
        userId,
        request.userEmail,
        request.ipAddress,
        request.userAgent,
        {
          consentId: createdConsent.getId().getValue(),
          consentGiven: request.consentGiven,
          consentText: request.consentText
        }
      );

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
   * @param invitationToken - Optional invitation token for external users
   * @returns The consent or null if not found
   */
  async getConsentBySignerAndEnvelope(signerId: SignerId, envelopeId: EnvelopeId, invitationToken?: string): Promise<Consent | null> {
    try {
      // Validate user has access to signer using InvitationTokenService
      if (invitationToken) {
        await this.validateSignerAccessWithToken(signerId, invitationToken);
      }

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
   */
  private async validateConsentCreation(request: CreateConsentRequest): Promise<void> {
    // Validate signer exists and user has access using InvitationTokenService
    if (request.invitationToken) {
      await this.validateSignerAccessWithToken(request.signerId, request.invitationToken);
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

}