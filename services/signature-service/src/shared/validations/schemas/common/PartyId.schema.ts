/**
 * @file PartyId.schema.ts
 * @summary Party ID validation schema
 * @description Zod schema for validating party ID branded type
 */

import { PartyIdSchema } from "../../../../domain/value-objects/Ids";

/**
 * @summary Party ID validation schema
 * @description Validates and transforms string to PartyId branded type
 */
export const PartyIdValidationSchema = PartyIdSchema;

/**
 * @summary Optional party ID validation schema
 * @description Validates optional party ID
 */
export const OptionalPartyIdValidationSchema = PartyIdSchema.optional();
