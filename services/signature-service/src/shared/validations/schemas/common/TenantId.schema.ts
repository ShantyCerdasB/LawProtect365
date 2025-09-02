/**
 * @file TenantId.schema.ts
 * @summary Tenant ID validation schema
 * @description Zod schema for validating tenant ID branded type
 */

import { TenantIdSchema } from "../../../../domain/value-objects/Ids";

/**
 * @summary Tenant ID validation schema
 * @description Validates and transforms string to TenantId branded type
 */
export const TenantIdValidationSchema = TenantIdSchema;

/**
 * @summary Optional tenant ID validation schema
 * @description Validates optional tenant ID
 */
export const OptionalTenantIdValidationSchema = TenantIdSchema.optional();
