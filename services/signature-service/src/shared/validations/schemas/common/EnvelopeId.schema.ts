/**
 * @file EnvelopeId.schema.ts
 * @summary Envelope ID validation schema
 * @description Zod schema for validating envelope ID branded type
 */

import { EnvelopeIdSchema } from "../../../../domain/value-objects/Ids";

/**
 * @summary Envelope ID validation schema
 * @description Validates and transforms string to EnvelopeId branded type
 */
export const EnvelopeIdValidationSchema = EnvelopeIdSchema;

/**
 * @summary Optional envelope ID validation schema
 * @description Validates optional envelope ID
 */
export const OptionalEnvelopeIdValidationSchema = EnvelopeIdSchema.optional();
