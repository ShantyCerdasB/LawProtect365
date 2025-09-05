/**
 * @file RequestsValidationService.ts
 * @summary Validation service for requests operations
 * @description Provides validation logic for all request operations
 */

import { BadRequestError, ConflictError, ErrorCodes } from "@lawprotect/shared-ts";
import type { Input } from "../../../domain/entities/Input";
import type { EnvelopeId, PartyId } from "../../../domain/value-objects/Ids";
import type { InputsRepository } from "../../../shared/contracts/repositories/inputs/InputsRepository";
import type { RequestsValidationService } from "../../../shared/types/requests/ServiceInterfaces";
import type { 
  InvitePartiesCommand,
  RemindPartiesCommand,
  CancelEnvelopeCommand,
  DeclineEnvelopeCommand,
  FinaliseEnvelopeCommand,
  RequestSignatureCommand,
  AddViewerCommand
} from "../../ports/requests/RequestsCommandsPort";

/**
 * @summary Validation service for requests operations
 * @description Validates input parameters for all request operations
 */
export class DefaultRequestsValidationService implements RequestsValidationService {
  
  constructor(private inputsRepo?: InputsRepository) {}
  
  /**
   * @summary Validate invite parties command
   */
  validateInviteParties(input: InvitePartiesCommand): void {
    if (!input.envelopeId || input.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
    
    if (!input.partyIds || !Array.isArray(input.partyIds) || input.partyIds.length === 0) {
      throw new BadRequestError("Party IDs array is required and cannot be empty", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
    
    // Validate each party ID
    for (const partyId of input.partyIds) {
      if (!partyId || partyId.trim().length === 0) {
        throw new BadRequestError("All party IDs must be valid", ErrorCodes.COMMON_BAD_REQUEST, { input });
      }
    }
  }

  /**
   * @summary Validate remind parties command
   */
  validateRemindParties(input: RemindPartiesCommand): void {
    if (!input.envelopeId || input.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
    
    // If partyIds is provided, validate each one
    if (input.partyIds && Array.isArray(input.partyIds)) {
      for (const partyId of input.partyIds) {
        if (!partyId || partyId.trim().length === 0) {
          throw new BadRequestError("All party IDs must be valid", ErrorCodes.COMMON_BAD_REQUEST, { input });
        }
      }
    }
    
    // Validate message length if provided
    if (input.message && input.message.length > 500) {
      throw new BadRequestError("Message cannot exceed 500 characters", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
  }

  /**
   * @summary Validate cancel envelope command
   */
  validateCancelEnvelope(input: CancelEnvelopeCommand): void {
    if (!input.envelopeId || input.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
    
    // Validate reason length if provided
    if (input.reason && input.reason.length > 500) {
      throw new BadRequestError("Reason cannot exceed 500 characters", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
  }

  /**
   * @summary Validate decline envelope command
   */
  validateDeclineEnvelope(input: DeclineEnvelopeCommand): void {
    if (!input.envelopeId || input.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
    
    // Validate reason length if provided
    if (input.reason && input.reason.length > 500) {
      throw new BadRequestError("Reason cannot exceed 500 characters", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
  }

  /**
   * @summary Validate finalise envelope command
   */
  validateFinaliseEnvelope(input: FinaliseEnvelopeCommand): void {
    if (!input.envelopeId || input.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
  }

  /**
   * @summary Validate request signature command
   */
  validateRequestSignature(input: RequestSignatureCommand): void {
    if (!input.envelopeId || input.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
    
    if (!input.partyId || input.partyId.trim().length === 0) {
      throw new BadRequestError("Party ID is required", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
    
    // Validate message length if provided
    if (input.message && input.message.length > 500) {
      throw new BadRequestError("Message cannot exceed 500 characters", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
  }

  /**
   * @summary Validate add viewer command
   */
  validateAddViewer(input: AddViewerCommand): void {
    if (!input.envelopeId || input.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
    
    if (!input.email || input.email.trim().length === 0) {
      throw new BadRequestError("Email is required", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
    
    // Validate email format
    if (!this.isValidEmailFormat(input.email)) {
      throw new BadRequestError("Invalid email format", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
  }

  /**
   * @summary Validates that envelope has at least one input field
   * @description Ensures document has input fields before inviting parties
   */
  async validateEnvelopeHasInputs(envelopeId: EnvelopeId): Promise<void> {
    if (!this.inputsRepo) return; // Skip validation if repo not available
    
    const documentInputs = await this.inputsRepo.listByEnvelope({
      envelopeId
    });
    
    if (documentInputs.items.length === 0) {
      throw new BadRequestError(
        "Document must have at least one input field before inviting parties",
        ErrorCodes.COMMON_BAD_REQUEST,
        { envelopeId }
      );
    }
  }

  /**
   * @summary Validates that all required input fields are completed
   * @description Ensures all required fields have values before finalizing envelope
   */
  async validateRequiredInputsComplete(envelopeId: EnvelopeId): Promise<void> {
    if (!this.inputsRepo) return; // Skip validation if repo not available
    
    const requiredInputs = await this.inputsRepo.listByEnvelope({
      envelopeId,
      required: true
    });
    
    const incompleteInputs = requiredInputs.items.filter((input: Input) => !input.value);
    if (incompleteInputs.length > 0) {
      throw new ConflictError(
        `Cannot finalize envelope with ${incompleteInputs.length} incomplete required fields`,
        ErrorCodes.COMMON_CONFLICT,
        { 
          envelopeId, 
          incompleteInputs: incompleteInputs.map((i: Input) => i.inputId),
          missingCount: incompleteInputs.length
        }
      );
    }
  }

  /**
   * @summary Validates that party has assigned input fields
   * @description Ensures party has fields to complete before requesting signature
   */
  async validatePartyHasAssignedInputs(envelopeId: EnvelopeId, partyId: PartyId): Promise<void> {
    if (!this.inputsRepo) return; // Skip validation if repo not available
    
    const partyInputs = await this.inputsRepo.listByEnvelope({
      envelopeId,
      partyId
    });
    
    if (partyInputs.items.length === 0) {
      throw new BadRequestError(
        "Party has no assigned input fields",
        ErrorCodes.COMMON_BAD_REQUEST,
        { envelopeId, partyId }
      );
    }
  }

  /**
   * @summary Validates that party has incomplete required fields
   * @description Checks if party has incomplete required fields for reminders
   */
  async validatePartyHasIncompleteRequiredFields(envelopeId: EnvelopeId, partyId: PartyId): Promise<boolean> {
    if (!this.inputsRepo) return false; // Skip validation if repo not available
    
    const requiredInputs = await this.inputsRepo.listByEnvelope({
      envelopeId,
      partyId,
      required: true
    });
    
    const incompleteInputs = requiredInputs.items.filter((input: Input) => !input.value);
    return incompleteInputs.length > 0;
  }

  /**
   * @summary Validates email format without using regex to prevent ReDoS attacks
   * @description Simple email validation that checks basic structure without complex regex
   */
  private isValidEmailFormat(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    
    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0 || trimmedEmail.length > 254) return false;
    
    const atIndex = trimmedEmail.indexOf('@');
    if (atIndex <= 0 || atIndex === trimmedEmail.length - 1) return false;
    
    const localPart = trimmedEmail.substring(0, atIndex);
    const domainPart = trimmedEmail.substring(atIndex + 1);
    
    // Check local part
    if (localPart.length === 0 || localPart.length > 64) return false;
    if (localPart.includes(' ') || localPart.includes('@')) return false;
    
    // Check domain part
    if (domainPart.length === 0 || domainPart.length > 253) return false;
    if (!domainPart.includes('.')) return false;
    if (domainPart.includes(' ')) return false;
    
    return true;
  }

}
