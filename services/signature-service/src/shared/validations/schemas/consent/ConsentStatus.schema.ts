/**
 * @file ConsentStatus.schema.ts
 * @summary Consent status validation schema
 * @description Zod schema for validating consent status using domain enums
 */

import { z } from "zod";
import { CONSENT_STATUSES } from "../../../../domain/values/enums";

/**
 * @summary Consent status validation schema
 * @description Validates consent status using domain enum values
 */
export const ConsentStatusValidationSchema = z.enum(CONSENT_STATUSES);

/**
 * @summary Optional consent status validation schema
 * @description Validates optional consent status
 */
export const OptionalConsentStatusValidationSchema = ConsentStatusValidationSchema.optional();
