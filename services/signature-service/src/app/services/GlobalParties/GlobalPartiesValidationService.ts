/**
 * @file GlobalPartiesValidationService.ts
 * @summary Validation service for Global Parties operations
 * @description Handles validation for Global Party operations using Zod schemas
 */

import { BadRequestError, UnprocessableEntityError, isEmail } from "@lawprotect/shared-ts";
import type { 
  GlobalPartiesValidationService,
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

    // Basic email format validation using shared validation
    if (!isEmail(input.email)) {
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

}
