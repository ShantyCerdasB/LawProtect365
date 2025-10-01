/**
 * @fileoverview ConsentService - Business logic service for consent operations
 * @summary Provides business logic for consent management using new architecture
 * @description This service handles all business logic for consent operations
 * including creation, validation, and coordination with other services using
 * the new Prisma-based architecture with proper separation of concerns.
 */

import { Consent } from '@/domain/entities/Consent';
import { ConsentId } from '@/domain/value-objects/ConsentId';
import { SignerId } from '@/domain/value-objects/SignerId';

  import { ConsentRepository } from '@/repositories/ConsentRepository';
import { EnvelopeSignerRepository } from '@/repositories/EnvelopeSignerRepository';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { CreateConsentRequest } from '@/domain/types/consent/CreateConsentRequest';
import { AuditEventType } from '@/domain/enums/AuditEventType';
import { 
  consentNotFound,
  consentAlreadyExists,
  consentCreationFailed
} from '@/signature-errors';

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
    private readonly AuditEventService: AuditEventService
  ) {}


  /**
   * Creates a new consent
   * @param request - The create consent request
   * @param userId - The user creating the consent
   * @returns The created consent
   */
  async createConsent(request: CreateConsentRequest, userId: string): Promise<Consent> {
    try {

      // Validate business rules - check if consent already exists
      const existingConsent = await this.consentRepository.findBySignerAndEnvelope(
        request.signerId,
        request.envelopeId
      );
      if (existingConsent) {
        throw consentAlreadyExists(
          `Consent already exists for signer ${request.signerId.getValue()} and envelope ${request.envelopeId.getValue()}`
        );
      }

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
        userAgent: request.userAgent,
        country: request.country
      });
      // Validate compliance using entity method
      consent.validateForCompliance();

      // Save to repository
      const createdConsent = await this.consentRepository.create(consent);

      // Get signer information for audit event
      const signer = await this.envelopeSignerRepository.findById(request.signerId);
      const signerName = signer?.getFullName() || signer?.getEmail()?.getValue() || 'Unknown';

      // Create audit event
      await this.AuditEventService.createSignerEvent({
        envelopeId: request.envelopeId.getValue(),
        signerId: request.signerId.getValue(),
        eventType: AuditEventType.CONSENT_GIVEN,
        description: `Consent given by signer ${signerName}`,
        userId: userId || `external-user:${signerName}`,
        userEmail: request.userEmail || signer?.getEmail()?.getValue(),
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
}