/**
 * @file PartiesValidationService.ts
 * @summary Validation service for Party operations
 * @description Handles validation logic for party create, update, and delete operations
 */

import type { 
  CreatePartyControllerInput,
  UpdatePartyControllerInput,
  DeletePartyControllerInput
} from "../../../shared/types/parties";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

/**
 * @summary Validation service for Party operations
 * @description Provides validation methods for party commands
 */
export class PartiesValidationService {
  /**
   * @summary Validates party creation input
   * @description Ensures all required fields are present and valid
   */
  async validateCreate(input: CreatePartyControllerInput): Promise<void> {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError(
        "Party name is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { input }
      );
    }

    if (!input.email || input.email.trim().length === 0) {
      throw new BadRequestError(
        "Party email is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { input }
      );
    }

    if (!input.role || input.role.trim().length === 0) {
      throw new BadRequestError(
        "Party role is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { input }
      );
    }

    // Validate email format (basic validation) - using simple validation to prevent ReDoS
    if (!this.isValidEmailFormat(input.email)) {
      throw new BadRequestError(
        "Invalid email format",
        ErrorCodes.COMMON_BAD_REQUEST,
        { input }
      );
    }

    // Validate sequence number if provided
    if (input.sequence !== undefined && (input.sequence < 1 || !Number.isInteger(input.sequence))) {
      throw new BadRequestError(
        "Sequence number must be a positive integer",
        ErrorCodes.COMMON_BAD_REQUEST,
        { input }
      );
    }
  }

  /**
   * @summary Validates party update input
   * @description Ensures at least one field is provided for update
   */
  async validateUpdate(input: UpdatePartyControllerInput): Promise<void> {
    const hasUpdates = input.name !== undefined || 
                      input.email !== undefined || 
                      input.role !== undefined || 
                      input.sequence !== undefined;

    if (!hasUpdates) {
      throw new BadRequestError(
        "At least one field must be provided for update",
        ErrorCodes.COMMON_BAD_REQUEST,
        { input }
      );
    }

    // Validate name if provided
    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new BadRequestError(
        "Party name cannot be empty",
        ErrorCodes.COMMON_BAD_REQUEST,
        { input }
      );
    }

    // Validate email if provided
    if (input.email !== undefined) {
      if (input.email.trim().length === 0) {
        throw new BadRequestError(
          "Party email cannot be empty",
          ErrorCodes.COMMON_BAD_REQUEST,
          { input }
        );
      }

      if (!this.isValidEmailFormat(input.email)) {
        throw new BadRequestError(
          "Invalid email format",
          ErrorCodes.COMMON_BAD_REQUEST,
          { input }
        );
      }
    }

    // Validate role if provided
    if (input.role !== undefined && input.role.trim().length === 0) {
      throw new BadRequestError(
        "Party role cannot be empty",
        ErrorCodes.COMMON_BAD_REQUEST,
        { input }
      );
    }

    // Validate sequence number if provided
    if (input.sequence !== undefined && (input.sequence < 1 || !Number.isInteger(input.sequence))) {
      throw new BadRequestError(
        "Sequence number must be a positive integer",
        ErrorCodes.COMMON_BAD_REQUEST,
        { input }
      );
    }
  }

  /**
   * @summary Validates party deletion input
   * @description Ensures required fields are present
   */
  async validateDelete(input: DeletePartyControllerInput): Promise<void> {
    if (!input.partyId || input.partyId.trim().length === 0) {
      throw new BadRequestError(
        "Party ID is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { input }
      );
    }

    if (!input.envelopeId || input.envelopeId.trim().length === 0) {
      throw new BadRequestError(
        "Envelope ID is required",
        ErrorCodes.COMMON_BAD_REQUEST,
        { input }
      );
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
