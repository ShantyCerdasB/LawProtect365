/**
 * @file ConsentValidation.rules.ts
 * @summary Validation rules for consent enums
 * @description Validates and converts string values to domain enums
 */

import { CONSENT_STATUSES } from "../../values/enums";
import type { ConsentStatus } from "../../values/enums";
import { badRequest } from "../../../shared/errors";

/**
 * @summary Validates and converts a string to ConsentStatus
 * @description Checks if the provided string is a valid consent status enum value.
 * Throws a BadRequestError if the value is invalid.
 *
 * @param {string} value - String value to validate
 * @returns {ConsentStatus} Validated consent status
 * @throws {BadRequestError} When the value is not a valid consent status
 */
export const validateConsentStatus = (value: string): ConsentStatus => {
  if (!CONSENT_STATUSES.includes(value as any)) {
    throw badRequest(`Invalid consent status: ${value}`, "INPUT_TYPE_NOT_ALLOWED", {
      validStatuses: CONSENT_STATUSES,
      providedStatus: value,
    });
  }
  return value as ConsentStatus;
};
