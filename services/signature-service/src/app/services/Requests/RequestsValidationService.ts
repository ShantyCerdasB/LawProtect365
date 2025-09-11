/**
 * @file RequestsValidationService.ts
 * @summary Validation service for requests operations
 * @description Provides validation logic for all request operations
 */

import { BadRequestError, ErrorCodes, isEmail } from "@lawprotect/shared-ts";
// import type { Input } from "../../../domain/entities/Input"; // Moved to Documents Service
import type { PartyId } from "@/domain/value-objects/ids";
// import type { InputsRepository } from "../../../domain/contracts/repositories/inputs/InputsRepository"; // Moved to Documents Service
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
  
  constructor() {} // inputsRepo moved to Documents Service

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
   * @param inputs - Input information from Documents Service
   */
  validateEnvelopeHasInputs(inputs: { hasInputs: boolean; inputCount: number }): void {
    if (!inputs.hasInputs) {
      throw new BadRequestError(
        "Document must have at least one input field before inviting parties",
        ErrorCodes.COMMON_BAD_REQUEST,
        { inputCount: inputs.inputCount }
      );
    }
  }

  /**
   * @summary Validates that all required input fields are completed
   * @description Ensures all required fields have values before finalizing envelope
   * @param inputs - Input information from Documents Service
   */
  validateRequiredInputsComplete(inputs: { hasInputs: boolean; inputCount: number }): void {
    if (!inputs.hasInputs) {
      throw new BadRequestError(
        "Cannot finalize envelope: no input fields defined",
        ErrorCodes.COMMON_BAD_REQUEST,
        { inputCount: inputs.inputCount }
      );
    }
    
    if (inputs.inputCount === 0) {
      throw new BadRequestError(
        "Cannot finalize envelope: no input fields completed",
        ErrorCodes.COMMON_BAD_REQUEST,
        { inputCount: inputs.inputCount }
      );
    }
  }

  /**
   * @summary Validates that party has assigned input fields
   * @description Ensures party has fields to complete before requesting signature
   * @param partyId - Party ID to validate
   * @param inputs - Input information from Documents Service
   */
  validatePartyHasAssignedInputs(partyId: PartyId, inputs: { assignedSigners: string[] }): void {
    // Extract email from partyId (format: "envelopeId:email")
    const partyEmail = partyId.split(':')[1];
    
    if (!inputs.assignedSigners.includes(partyEmail)) {
      throw new BadRequestError(
        "Party has no assigned input fields",
        ErrorCodes.COMMON_BAD_REQUEST,
        { partyId, partyEmail, assignedSigners: inputs.assignedSigners }
      );
    }
  }

};

