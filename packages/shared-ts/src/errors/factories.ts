/**
 * @fileoverview Error Factories - Factory functions for creating common errors
 * @summary Convenient factory functions for creating standardized errors
 * @description This module provides factory functions that create common error instances
 * with appropriate default messages and error codes, following the established patterns
 * for error handling across the platform.
 */

import { BadRequestError } from "./errors.js";
import { ErrorCodes } from "./codes.js";

/**
 * Creates a pagination limit required error
 * @param details - Optional additional details about the error
 * @returns BadRequestError with pagination limit required code
 */
export const paginationLimitRequired = (details?: unknown) =>
  new BadRequestError(
    "Pagination limit is required",
    ErrorCodes.PAGINATION_LIMIT_REQUIRED,
    details
  );
