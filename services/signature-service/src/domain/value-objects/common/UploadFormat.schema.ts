/**
 * @file UploadFormat.schema.ts
 * @summary Upload format validation schema
 * @description Zod schema for validating upload format using domain enums
 */

import { z } from "zod";
import { UPLOAD_FORMATS } from "../../values/enums";

/**
 * @summary Upload format validation schema
 * @description Validates upload format using domain enum values
 */
export const UploadFormatValidationSchema = z.enum(UPLOAD_FORMATS);

/**
 * @summary Optional upload format validation schema
 * @description Validates optional upload format with default value
 */
export const OptionalUploadFormatValidationSchema = UploadFormatValidationSchema.optional().default("json");
