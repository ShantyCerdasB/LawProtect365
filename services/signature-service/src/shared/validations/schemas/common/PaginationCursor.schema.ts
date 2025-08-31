/**
 * @file PaginationCursor.schema.ts
 * @summary Pagination cursor validation schema
 * @description Zod schema for validating pagination cursor branded type
 */

import { z } from "zod";
import { PaginationCursorSchema } from "../../../../domain/value-objects/PaginationCursor";

/**
 * @summary Pagination cursor validation schema
 * @description Validates and transforms string to PaginationCursor branded type
 */
export const PaginationCursorValidationSchema = PaginationCursorSchema;

/**
 * @summary Optional pagination cursor validation schema
 * @description Validates optional pagination cursor
 */
export const OptionalPaginationCursorValidationSchema = PaginationCursorSchema.optional();
