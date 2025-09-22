/**
 * @fileoverview wrapServiceError - Centralized error handling for service operations
 * @summary Provides consistent error handling across all services
 * @description This utility provides a centralized way to handle errors in service operations,
 * ensuring that specific business errors (AppError instances) are preserved while unexpected
 * errors are properly wrapped as InternalError. This eliminates the need to modify each service
 * individually and provides consistent error handling across the entire application.
 */

import { AppError } from './AppError.js';
import { InternalError } from './errors.js';

/**
 * Wraps service operation errors with consistent handling
 * 
 * This function provides centralized error handling for service operations:
 * - Preserves specific business errors (AppError instances) as-is
 * - Converts unexpected errors to InternalError with proper context
 * - Eliminates the need for repetitive error handling in each service
 * - Ensures consistent error behavior across all services
 * 
 * @param error - The error that occurred during the operation
 * @param operation - Description of the operation that failed (e.g., 'create user', 'update envelope')
 * @throws AppError - Re-throws specific business errors unchanged
 * @throws InternalError - Converts unexpected errors to InternalError
 * @example
 * ```typescript
 * try {
 *   await someServiceOperation();
 * } catch (error) {
 *   wrapServiceError(error, 'create user');
 * }
 * ```
 */
export const wrapServiceError = (error: Error, operation: string): never => {
  // If it's already a specific business error (AppError), preserve it as-is
  if (error instanceof AppError) {
    throw error;
  }
  
  // Convert unexpected errors to InternalError with proper context
  throw new InternalError(
    `Failed to ${operation}: ${error.message}`,
    undefined,
    error
  );
};
