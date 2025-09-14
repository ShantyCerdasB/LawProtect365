/**
 * @file ConsentValidationService.ts
 * @summary Validation service for consent business logic
 * @description Handles business logic validations for consent operations,
 * including delegation validations and state checks.
 */

import type { ConsentQueriesPort } from "../../../app/ports/consent/ConsentQueriesPort";
import type { ConsentDelegationValidationInput } from "../../../domain/types/consent/ValidationInputs";
import { ConsentStatus } from "../../../domain/values/enums";
import { BadRequestError, NotFoundError } from "../../../shared/errors";

/**
 * @summary Validation service for consent business logic
 * @description Handles business logic validations for consent operations.
 * This service focuses on business rules rather than input validation.
 */
export class ConsentValidationService {
  constructor(private readonly consentQueries: ConsentQueriesPort) {}

  /**
   * @summary Validates consent delegation request
   * @description Checks if the consent can be delegated based on business rules
   * @param input - Consent delegation validation input
   * @throws BadRequestError if validation fails
   */
  async validateConsentDelegation(
    input: ConsentDelegationValidationInput
  ): Promise<void> {
    // 1. Check if consent exists and is in a delegatable state
    const consent = await this.consentQueries.getById({
      envelopeId: input.envelopeId,
      consentId: input.consentId});

    if (!consent) {
      throw new NotFoundError(`Consent not found: ${input.consentId}`);
    }

    // 2. Check if consent is already delegated
    if (consent.status === "delegated") {
      throw new BadRequestError(`Consent is already delegated: ${input.consentId}`);
    }

    // 3. Check if consent is in a valid state for delegation
    const delegatableStatuses: ConsentStatus[] = ["pending", "granted"];
    if (!delegatableStatuses.includes(consent.status)) {
      throw new BadRequestError(`Consent cannot be delegated in status '${consent.status}': ${input.consentId}`);
    }

    // 4. Validate delegate information
    if (!input.delegateEmail || !input.delegateName) {
      throw new BadRequestError("Delegate email and name are required");
    }

    // 5. Check if delegate is different from original party
    if (consent.partyId === input.delegateEmail) {
      throw new BadRequestError("Cannot delegate consent to the same party");
    }
  }
};
