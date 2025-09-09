/**
 * @file ConsentId.schema.ts
 * @summary Consent ID validation schema
 * @description Zod schema for validating consent ID branded type
 */

import { ConsentIdSchema } from "./index";

/**
 * @summary Consent ID validation schema
 * @description Validates and transforms string to ConsentId branded type
 */
export const ConsentIdValidationSchema = ConsentIdSchema;

/**
 * @summary Optional consent ID validation schema
 * @description Validates optional consent ID
 */
export const OptionalConsentIdValidationSchema = ConsentIdSchema.optional();
