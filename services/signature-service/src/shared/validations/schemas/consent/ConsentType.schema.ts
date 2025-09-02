/**
 * @file ConsentType.schema.ts
 * @summary Consent type validation schema
 * @description Zod schema for validating consent type using domain enums
 */

import { z } from "zod";
import { CONSENT_TYPES } from "../../../../domain/values/enums";

/**
 * @summary Consent type validation schema
 * @description Validates consent type using domain enum values
 */
export const ConsentTypeValidationSchema = z.enum(CONSENT_TYPES);

/**
 * @summary Optional consent type validation schema
 * @description Validates optional consent type
 */
export const OptionalConsentTypeValidationSchema = ConsentTypeValidationSchema.optional();
