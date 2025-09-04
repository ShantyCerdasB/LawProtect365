/**
 * @file RequestsValidationService.ts
 * @summary Validation service for requests operations
 * @description Provides validation logic for all request operations
 */

import type { 
  InvitePartiesCommand,
  RemindPartiesCommand,
  CancelEnvelopeCommand,
  DeclineEnvelopeCommand,
  FinaliseEnvelopeCommand,
  RequestSignatureCommand,
  AddViewerCommand
} from "../../ports/requests/RequestsCommandsPort";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

/**
 * @summary Validation service for requests operations
 * @description Validates input parameters for all request operations
 */
export class RequestsValidationService {
  
  /**
   * @summary Validate invite parties command
   */
  async validateInviteParties(command: InvitePartiesCommand): Promise<void> {
    if (!command.envelopeId || command.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
    
    if (!command.partyIds || !Array.isArray(command.partyIds) || command.partyIds.length === 0) {
      throw new BadRequestError("Party IDs array is required and cannot be empty", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
    
    // Validate each party ID
    for (const partyId of command.partyIds) {
      if (!partyId || partyId.trim().length === 0) {
        throw new BadRequestError("All party IDs must be valid", ErrorCodes.COMMON_BAD_REQUEST, { command });
      }
    }
  }

  /**
   * @summary Validate remind parties command
   */
  async validateRemindParties(command: RemindPartiesCommand): Promise<void> {
    if (!command.envelopeId || command.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
    
    // If partyIds is provided, validate each one
    if (command.partyIds && Array.isArray(command.partyIds)) {
      for (const partyId of command.partyIds) {
        if (!partyId || partyId.trim().length === 0) {
          throw new BadRequestError("All party IDs must be valid", ErrorCodes.COMMON_BAD_REQUEST, { command });
        }
      }
    }
    
    // Validate message length if provided
    if (command.message && command.message.length > 500) {
      throw new BadRequestError("Message cannot exceed 500 characters", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
  }

  /**
   * @summary Validate cancel envelope command
   */
  async validateCancelEnvelope(command: CancelEnvelopeCommand): Promise<void> {
    if (!command.envelopeId || command.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
    
    // Validate reason length if provided
    if (command.reason && command.reason.length > 500) {
      throw new BadRequestError("Reason cannot exceed 500 characters", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
  }

  /**
   * @summary Validate decline envelope command
   */
  async validateDeclineEnvelope(command: DeclineEnvelopeCommand): Promise<void> {
    if (!command.envelopeId || command.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
    
    // Validate reason length if provided
    if (command.reason && command.reason.length > 500) {
      throw new BadRequestError("Reason cannot exceed 500 characters", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
  }

  /**
   * @summary Validate finalise envelope command
   */
  async validateFinaliseEnvelope(command: FinaliseEnvelopeCommand): Promise<void> {
    if (!command.envelopeId || command.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
  }

  /**
   * @summary Validate request signature command
   */
  async validateRequestSignature(command: RequestSignatureCommand): Promise<void> {
    if (!command.envelopeId || command.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
    
    if (!command.partyIds || !Array.isArray(command.partyIds) || command.partyIds.length === 0) {
      throw new BadRequestError("Party IDs array is required and cannot be empty", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
    
    // Validate each party ID
    for (const partyId of command.partyIds) {
      if (!partyId || partyId.trim().length === 0) {
        throw new BadRequestError("All party IDs must be valid", ErrorCodes.COMMON_BAD_REQUEST, { command });
      }
    }
    
    // Validate message length if provided
    if (command.message && command.message.length > 500) {
      throw new BadRequestError("Message cannot exceed 500 characters", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
  }

  /**
   * @summary Validate add viewer command
   */
  async validateAddViewer(command: AddViewerCommand): Promise<void> {
    if (!command.envelopeId || command.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
    
    if (!command.partyId || command.partyId.trim().length === 0) {
      throw new BadRequestError("Party ID is required", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
    
    // Validate message length if provided
    if (command.message && command.message.length > 500) {
      throw new BadRequestError("Message cannot exceed 500 characters", ErrorCodes.COMMON_BAD_REQUEST, { command });
    }
  }
}
