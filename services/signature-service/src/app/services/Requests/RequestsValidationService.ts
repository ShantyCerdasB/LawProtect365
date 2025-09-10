/**
 * @file RequestsValidationService.ts
 * @summary Validation service for requests operations
 * @description Provides validation logic for all request operations
 */

import { BadRequestError, ConflictError, ErrorCodes, isEmail } from "@lawprotect/shared-ts";
import type { Input } from "../../../domain/entities/Input";
import type { EnvelopeId, PartyId } from "@/domain/value-objects/ids";
import type { InputsRepository } from "../../../domain/contracts/repositories/inputs/InputsRepository";
import type { RequestsValidationService as IRequestsValidationService } from "../../../domain/types/requests/ServiceInterfaces";
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
export class RequestsValidationService implements IRequestsValidationService {
  
  constructor(private readonly inputsRepo?: InputsRepository) {}

  /**
   * Helper function to validate envelope operations (cancel/decline)
   */
  private validateEnvelopeOperation(input: { envelopeId: string; reason?: string }): void {
    if (!input.envelopeId || input.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
    
    // Validate reason length if provided
    if (input.reason && input.reason.length > 500) {
      throw new BadRequestError("Reason cannot exceed 500 characters", ErrorCodes.COMMON_BAD_REQUEST, { input });
    }
  }
  
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
    this.validateEnvelopeOperation(input);
  }

  /**
   * @summary Validate decline envelope command
   */
  validateDeclineEnvelope(input: DeclineEnvelopeCommand): void {
    this.validateEnvelopeOperation(input);
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
    
    // Validate email format using shared validation
    if (!isEmail(input.email)) {
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
};

