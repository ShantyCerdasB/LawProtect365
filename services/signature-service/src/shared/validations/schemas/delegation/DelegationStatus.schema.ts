/**
 * @file DelegationStatus.schema.ts
 * @summary Validation schema for delegation status
 * @description Zod schema for validating delegation status values
 */

import { z } from "@lawprotect/shared-ts";
import { DELEGATION_STATUSES } from "@/domain/values/enums";

/**
 * @summary Validation schema for delegation status
 * @description Validates that the status is one of the supported delegation statuses
 */
export const DelegationStatusValidationSchema = z.enum(DELEGATION_STATUSES);

/**
 * @summary Optional delegation status validation schema
 * @description Validates optional delegation status values
 */
export const OptionalDelegationStatusValidationSchema = DelegationStatusValidationSchema.optional();

export type DelegationStatusValidationType = z.infer<typeof DelegationStatusValidationSchema>;
export type OptionalDelegationStatusValidationType = z.infer<typeof OptionalDelegationStatusValidationSchema>;
