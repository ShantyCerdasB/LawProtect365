/**
 * @file RequestsValidationService.ts
 * @summary Validation service for requests operations
 * @description Provides validation logic for all request operations
 */

import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";
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
