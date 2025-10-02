/**
 * @file EnvelopeId.schema.ts
 * @summary Envelope ID validation schema
 * @description Zod schema for validating envelope ID branded type
 */

/**
 * @summary Envelope ID validation schema
 * @description Validates and transforms string to EnvelopeId branded type
 */
export { EnvelopeIdSchema as EnvelopeIdValidationSchema } from "./index";

/**
 * @summary Optional envelope ID validation schema
 * @description Validates optional envelope ID
 */
export const OptionalEnvelopeIdValidationSchema = EnvelopeIdSchema.optional();
