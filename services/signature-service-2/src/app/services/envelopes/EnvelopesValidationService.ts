/**
 * @file EnvelopesValidationService.ts
 * @summary Validation service for envelope operations
 * @description Validates envelope state transitions and business rules
 */

import type { EnvelopeId } from "../../../domain/value-objects/ids";
import type { EnvelopeStatus } from "../../../domain/value-objects/index";
import { 
  ENVELOPE_STATUSES, 
  ENVELOPE_TRANSITION_RULES, 
  ENVELOPE_TITLE_LIMITS, 
  ENVELOPE_VALIDATION_RULES 
} from "../../../domain/values/enums";
import { badRequest } from "../../../shared/errors";

/**
 * @summary Validates envelope state transitions
 * @description Ensures envelope status changes follow business rules
 */
export class EnvelopesValidationService {
  /**
   * @summary Validates if an envelope status transition is allowed
   * @param currentStatus - Current envelope status
   * @param newStatus - Proposed new status
   * @returns true if transition is valid, false otherwise
   */
  validateStatusTransition(currentStatus: EnvelopeStatus, newStatus: EnvelopeStatus): boolean {
    const allowedTransitions = ENVELOPE_TRANSITION_RULES[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * @summary Validates envelope creation parameters
   * @param params - Envelope creation parameters
   * @returns true if parameters are valid, false otherwise
   */
  validateCreateParams(params: {
    ownerEmail: string;
    name: string;
  }, actorEmail?: string): boolean {
    // Basic validation
    const basicValidation = (
      params !== undefined &&
      params.ownerEmail !== undefined &&
      params.ownerEmail.trim().length > 0 &&
      params.name !== undefined &&
      params.name.trim().length >= ENVELOPE_TITLE_LIMITS.MIN_LENGTH &&
      params.name.trim().length <= ENVELOPE_TITLE_LIMITS.MAX_LENGTH
    );

    // Authorization validation - user can only create envelopes for their own email
    const authorizationValidation = !actorEmail || params.ownerEmail === actorEmail;

    return basicValidation && authorizationValidation;
  }

  /**
   * @summary Validates envelope update parameters
   * @param params - Envelope update parameters
   * @returns true if parameters are valid, false otherwise
   */
  validateUpdateParams(params: {
    envelopeId: EnvelopeId;
    name?: string;
    status?: EnvelopeStatus;
  }): boolean {
    if (params.name !== undefined) {
      if (
        params.name.trim().length < ENVELOPE_TITLE_LIMITS.MIN_LENGTH || 
        params.name.trim().length > ENVELOPE_TITLE_LIMITS.MAX_LENGTH
      ) {
        return false;
      }
    }

    if (params.status !== undefined) {
      if (!ENVELOPE_STATUSES.includes(params.status)) {
        return false;
      }
    }

    return true;
  }

  /**
   * @summary Validates if an envelope can be deleted
   * @param currentStatus - Current envelope status
   * @returns true if envelope can be deleted, false otherwise
   */
  canDeleteEnvelope(currentStatus: EnvelopeStatus): boolean {
    // Only draft envelopes can be deleted
    return currentStatus === "draft";
  }

  /**
   * @summary Validates envelope parties count
   * @param partiesCount - Number of parties
   * @returns true if parties count is valid, false otherwise
   */
  validatePartiesCount(partiesCount: number): boolean {
    return partiesCount >= 0 && partiesCount <= ENVELOPE_VALIDATION_RULES.MAX_PARTIES;
  }

  /**
   * @summary Validates envelope documents count
   * @param documentsCount - Number of documents
   * @returns true if documents count is valid, false otherwise
   */
  validateDocumentsCount(documentsCount: number): boolean {
    return documentsCount >= 0 && documentsCount <= ENVELOPE_VALIDATION_RULES.MAX_DOCUMENTS;
  }

  /**
   * @summary Validates if envelope can be modified
   * @param currentStatus - Current envelope status
   * @returns true if envelope can be modified, false otherwise
   */
  canModifyEnvelope(currentStatus: EnvelopeStatus): boolean {
    // Only draft and sent envelopes can be modified
    return currentStatus === "draft" || currentStatus === "sent";
  }

  /**
   * @summary Validates if envelope can be sent
   * @param currentStatus - Current envelope status
   * @param partiesCount - Number of parties
   * @param documentsCount - Number of documents
   * @returns true if envelope can be sent, false otherwise
   */
  canSendEnvelope(currentStatus: EnvelopeStatus, partiesCount: number, documentsCount: number): boolean {
    return (
      currentStatus === "draft" &&
      partiesCount > 0 &&
      documentsCount > 0 &&
      this.validatePartiesCount(partiesCount) &&
      this.validateDocumentsCount(documentsCount)
    );
  }

  /**
   * @summary Validates get envelope by ID query
   * @param query - Get envelope query parameters
   * @returns Promise that resolves if validation passes, rejects if validation fails
   */
  async validateGetById(query: { envelopeId: EnvelopeId }): Promise<void> {
    if (!query || !query.envelopeId) {
      throw badRequest("EnvelopeId is required for getById operation");
    }
  }

  /**
   * @summary Validates list envelopes query
   * @param query - List envelopes query parameters
   * @returns Promise that resolves if validation passes, rejects if validation fails
   */
  async validateList(query: {  limit?: number; cursor?: string }): Promise<void> {

    if (query.limit && (query.limit < 1 || query.limit > 100)) {
      throw badRequest("Limit must be between 1 and 100");
    }
  }

  /**
   * @summary Validates get envelope status query
   * @param query - Get envelope status query parameters
   * @returns Promise that resolves if validation passes, rejects if validation fails
   */
  async validateGetStatus(query: { envelopeId: EnvelopeId }): Promise<void> {
    if (!query || !query.envelopeId) {
      throw badRequest("EnvelopeId is required for getStatus operation");
    }
  }
};
