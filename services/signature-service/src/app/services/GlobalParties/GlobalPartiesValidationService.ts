/**
 * @file GlobalPartiesValidationService.ts
 * @summary Validation service for Global Parties operations
 * @description Handles validation for Global Party operations using Zod schemas
 */

import { BadRequestError, UnprocessableEntityError } from "@lawprotect/shared-ts";
import type { GlobalPartiesValidationService } from "../../../shared/types/global-parties";
import type { 
  CreateGlobalPartyControllerInput,
  UpdateGlobalPartyControllerInput,
  DeleteGlobalPartyControllerInput,
  ListGlobalPartiesControllerInput,
  SearchGlobalPartiesByEmailControllerInput
} from "../../../shared/types/global-parties";

/**
 * @description Default implementation of GlobalPartiesValidationService
 */
export class DefaultGlobalPartiesValidationService implements GlobalPartiesValidationService {
  validateCreate(input: CreateGlobalPartyControllerInput): void {
    if (!input.name?.trim()) {
      throw new BadRequestError(
        "Name is required and cannot be empty",
        "GLOBAL_PARTY_NAME_REQUIRED"
      );
    }
    
    if (!input.email?.trim()) {
      throw new BadRequestError(
        "Email is required and cannot be empty",
        "GLOBAL_PARTY_EMAIL_REQUIRED"
      );
    }

    // Basic email format validation - using simple validation to prevent ReDoS
    if (!this.isValidEmailFormat(input.email)) {
      throw new UnprocessableEntityError(
        "Invalid email format",
        "GLOBAL_PARTY_INVALID_EMAIL_FORMAT"
      );
    }
  }

  validateUpdate(input: UpdateGlobalPartyControllerInput): void {
    if (!input.partyId?.trim()) {
      throw new BadRequestError(
        "Party ID is required",
        "GLOBAL_PARTY_ID_REQUIRED"
      );
    }

    if (input.updates.email && !input.updates.email.trim()) {
      throw new BadRequestError(
        "Email cannot be empty if provided",
        "GLOBAL_PARTY_EMAIL_CANNOT_BE_EMPTY"
      );
    }

    if (input.updates.name && !input.updates.name.trim()) {
      throw new BadRequestError(
        "Name cannot be empty if provided",
        "GLOBAL_PARTY_NAME_CANNOT_BE_EMPTY"
      );
    }
  }

  validateDelete(input: DeleteGlobalPartyControllerInput): void {
    if (!input.partyId?.trim()) {
      throw new BadRequestError(
        "Party ID is required",
        "GLOBAL_PARTY_ID_REQUIRED"
      );
    }
  }

  validateList(input: ListGlobalPartiesControllerInput): void {
    if (input.limit && (input.limit < 1 || input.limit > 100)) {
      throw new BadRequestError(
        "Limit must be between 1 and 100",
        "GLOBAL_PARTY_INVALID_LIMIT"
      );
    }
  }

  validateSearchByEmail(input: SearchGlobalPartiesByEmailControllerInput): void {
    if (!input.email?.trim()) {
      throw new BadRequestError(
        "Email is required for search",
        "GLOBAL_PARTY_SEARCH_EMAIL_REQUIRED"
      );
    }

    if (input.limit && (input.limit < 1 || input.limit > 50)) {
      throw new BadRequestError(
        "Search limit must be between 1 and 50",
        "GLOBAL_PARTY_INVALID_SEARCH_LIMIT"
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
