/**
 * @file consent.validations.ts
 * @summary Validation functions for consent enums
 * @description Validates and converts string values to domain enums
 */

import { CONSENT_TYPES, CONSENT_STATUSES } from "../../../../domain/values/enums";
import type { ConsentType, ConsentStatus } from "../../../../domain/values/enums";
import { badRequest } from "../../../../shared/errors";

/**
 * @summary Validates and converts a string to ConsentType
 * @description Checks if the provided string is a valid consent type enum value.
 * Throws a BadRequestError if the value is invalid.
 *
 * @param {string} value - String value to validate
 * @returns {ConsentType} Validated consent type
 * @throws {BadRequestError} When the value is not a valid consent type
 */
export const validateConsentType = (value: string): ConsentType => {
  if (!CONSENT_TYPES.includes(value as any)) {
    throw badRequest(`Invalid consent type: ${value}`, "INPUT_TYPE_NOT_ALLOWED", {
      validTypes: CONSENT_TYPES,
      providedType: value,
    });
  }
  return value as ConsentType;
};

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
